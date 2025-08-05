import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaPaperclip, FaSmile, FaPaperPlane, FaInfoCircle, FaBellSlash, FaTimes } from 'react-icons/fa';
import { io } from 'socket.io-client';
import axios from 'axios';
import API from '../api'; // Adjust the import path as necessary

const socket = io(`${import.meta.env.VITE_CHAT_API}`);

const NewAdminChat = () => {
  const { batchId } = useParams();
  const [sender, setSender] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [chatType, setChatType] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatAreaRef = useRef(null);

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
        const res = await API.get("/api/admin-batches/my-batches", {
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
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_CHAT_API}/students/${course}/${batch}/${encodeURIComponent(sender.trim())}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
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
    <div className="flex h-full bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            <h3>{course} - {chatType === "forum" ? "Course Chat" : `Chat with ${decodeURIComponent(selectedTarget)}`}</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4" ref={chatAreaRef}>
          {messages.map((m, i) => {
            const [name, ...textParts] = m.split(": ");
            const decodedName = decodeURIComponent(name);
            const isSender = decodedName === sender;
            const messageText = textParts.join(": ");

            return (
              <div key={i} className={`flex mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 max-w-lg ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}>
                  <div className="font-semibold">{decodedName}</div>
                  <p>{messageText}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <FaPaperclip className="text-gray-500 dark:text-gray-400 cursor-pointer" />
            <FaSmile className="text-gray-500 dark:text-gray-400 cursor-pointer mx-2" />
            <input type="text" placeholder="Type a message..." value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white" />
            <button className="bg-blue-500 text-white rounded-full p-2" onClick={sendMessage}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-lg text-gray-800 dark:text-white">Participants</h4>
          <input type="text" placeholder="Search..." className="w-full mt-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none text-gray-800 dark:text-white" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div
            onClick={() => selectChat("forum")}
            className={`flex items-center p-3 rounded-lg cursor-pointer ${chatType === 'forum' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">FC</div>
            <div className="ml-3">
              <div className="font-semibold text-gray-800 dark:text-white">Forum Chat</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">General discussion</div>
            </div>
          </div>
          {students.map((student) => (
            <div
              key={student}
              onClick={() => selectChat("student", student)}
              className={`flex items-center p-3 rounded-lg cursor-pointer ${selectedTarget === student && chatType === 'student' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 text-white flex items-center justify-center font-semibold">{getInitials(student)}</div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-800 dark:text-white">{decodeURIComponent(student)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Student</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewAdminChat;