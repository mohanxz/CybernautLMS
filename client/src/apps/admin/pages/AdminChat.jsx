import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const socket = io("http://localhost:5006");

export default function AdminChat() {
  const { batchId } = useParams();
  const [sender, setSender] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [chatType, setChatType] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();

  const room =
    chatType === "forum"
      ? `${course}/${batch}/forum/general`
      : chatType === "student" && selectedTarget
      ? `${course}/${batch}/admins/${encodeURIComponent(sender.trim())}/students/${encodeURIComponent(selectedTarget.trim())}`
      : null;

  useEffect(() => {
    const fetchMyBatch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5002/api/admin-batches/my-batches", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const myId = JSON.parse(atob(token.split('.')[1])).id;
        const matchingBatch = res.data.find(b => b._id === batchId);

        if (!matchingBatch) return;

        setCourse(matchingBatch.course.courseName);
        setBatch(matchingBatch.batchName);

        const adminInfo = matchingBatch.admins.find(a => a.admin._id === myId);
        if (adminInfo) setSender(adminInfo.admin.name);
      } catch (err) {
        console.error("Error fetching admin batches:", err);
      }
    };

    fetchMyBatch();
  }, []);

  useEffect(() => {
    if (!course || !batch || !sender) return;
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
  `http://localhost:5006/students/${course}/${batch}/${encodeURIComponent(sender.trim())}`
);


        setStudents(res.data);
      } catch (err) {
        console.error("Error loading students", err);
      }
    };
    fetchStudents();
  }, [course, batch, sender]);

  useEffect(() => {
    if (!room) return;

    socket.emit("joinRoom", { name: sender, room });

    socket.on("chatHistory", (history) => setMessages(history));
    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.emit("leaveRoom", { room });
      socket.off("chatHistory");
      socket.off("message");
    };
  }, [room]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // Auto-select forum chat once required values are set
useEffect(() => {
  if (course && batch && sender && !chatType) {
    selectChat("forum");
  }
}, [course, batch, sender]);


  const sendMessage = () => {
    if (!msg.trim()) return;
    socket.emit("message", { name: sender, room, message: msg });
    setMsg("");
  };

  const selectChat = (type, target = null) => {
    setChatType(type);
    setSelectedTarget(target);
    setMessages([]);
  };

  const getInitials = (name) =>
    decodeURIComponent(name)
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
  <div className="relative w-full h-[720px] flex overflow-hidden bg-white dark:bg-gray-900">
    
    {/* Chat Section */}
    <div className="flex-1 flex flex-col border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 text-lg font-semibold text-blue-700 dark:text-blue-400">
        {course} - {chatType === "forum" ? "Course Chat" : `Chat with ${decodeURIComponent(selectedTarget)}`}
      </div>

      <div ref={chatRef} className="flex-1 px-6 py-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-800">
        {messages.map((m, i) => {
          const [name, ...textParts] = m.split(": ");
          const decodedName = decodeURIComponent(name);
          const isSender = decodedName === sender;
          const messageText = textParts.join(": ");

          return (
            <div key={i} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
              {!isSender && (
                <div className="flex items-start space-x-2 max-w-[75%]">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-sm flex items-center justify-center font-semibold text-gray-700 dark:text-white">
                    {getInitials(decodedName)}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 font-medium mb-1">
                      {decodedName}
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words shadow">
                      {messageText}
                    </div>
                  </div>
                </div>
              )}
              {isSender && (
                <div className="flex flex-col items-end max-w-[75%]">
                  <div className="text-xs text-gray-500 dark:text-gray-300 font-medium mb-1">You</div>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words shadow">
                    {messageText}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>

    {/* Right Sidebar */}
    <div className="w-80 border-l border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Participants</h2>
      <p className="text-xs text-gray-500 dark:text-gray-300 mb-4">
        {1 + students.length} participant{students.length !== 1 ? "s" : ""}
      </p>

      {/* Forum Chat */}
      <div
        onClick={() => selectChat("forum")}
        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer mb-4 ${
          chatType === "forum" ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-white font-bold flex items-center justify-center">
          FC
        </div>
        <div>
          <div className="font-medium text-sm text-gray-800 dark:text-white">Forum Chat</div>
          <div className="text-xs text-gray-500 dark:text-gray-300">General discussion</div>
        </div>
      </div>

      {/* Student List */}
      {students.map((student) => (
        <div
          key={student}
          onClick={() => selectChat("student", student)}
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer mb-2 ${
            selectedTarget === student && chatType === "student"
              ? "bg-blue-100 dark:bg-blue-900"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <div className="relative w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-sm flex items-center justify-center font-semibold text-gray-700 dark:text-white">
            {getInitials(student)}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900 dark:text-white">
              {decodeURIComponent(student)}
            </div>
            <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded w-fit">
              student
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}