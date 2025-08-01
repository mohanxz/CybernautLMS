import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5006");

export default function SuperAdminChat() {
  const [sender, setSender] = useState("");
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5004/auth/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const name = res.data.user.name;
        setSender(name);
        setRoom(`admins/${encodeURIComponent(name.trim())}`);
      } catch (err) {
        console.error("Failed to fetch admin", err);
      }
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (!room || !sender) return;

    socket.emit("joinRoom", { name: sender, room });
    socket.on("chatHistory", (history) => setMessages(history));
    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.emit("leaveRoom", { room });
      socket.off("chatHistory");
      socket.off("message");
    };
  }, [room, sender]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!msg.trim()) return;
    socket.emit("message", { name: sender, room, message: msg });
    setMsg("");
  };

  if (!room) return null;

  return (
    <div className="flex flex-col bg-white dark:bg-black text-black dark:text-white rounded-lg shadow overflow-hidden h-full">

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-100 dark:bg-gray-900"
      >
        {messages.map((m, i) => {
          const [name, ...text] = m.split(": ");
          const isSender = name === sender;
          const displayName = isSender ? "You" : "Super Admin";

          return (
            <div
              key={i}
              className={`flex flex-col ${isSender ? "items-end" : "items-start"}`}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                {displayName}
              </div>
              <div
                className={`max-w-sm px-4 py-2 rounded-xl text-sm break-words whitespace-pre-wrap ${
                  isSender
                    ? "bg-blue-600 text-white self-end ml-auto rounded-br-none"
                    : "bg-white dark:bg-gray-800 text-black dark:text-white self-start mr-auto border border-gray-300 dark:border-gray-700 rounded-bl-none"
                }`}
              >
                {text.join(": ")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-3 text-base outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full text-base"
        >
          Send
        </button>
      </div>
    </div>
  );
}