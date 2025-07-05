import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaSearch, FaUserCircle, FaUsers } from "react-icons/fa";

const socket = io("http://localhost:5006");
const sender = "superadmin";

const SuperAdminChat = () => {
  const [courseFilter, setCourseFilter] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [forumRooms, setForumRooms] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [chatType, setChatType] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();
  const [adminStatus, setAdminStatus] = useState({});


  const room =
    chatType === "forum" && selectedTarget
      ? selectedTarget
      : chatType === "admin" && selectedTarget
      ? `admins/${encodeURIComponent(selectedTarget.trim())}`
      : null;

  // Fetch Forum Rooms
useEffect(() => {
  const fetchForumChats = async () => {
    try {
      const { data: courses } = await axios.get("http://localhost:5006/chatrooms");
      const allRooms = [];

      for (let rawCourse of courses) {
        if (rawCourse !== 'admins') {
          const course = decodeURIComponent(rawCourse);
          const batchListRes = await axios.get(`http://localhost:5006/chatrooms/${encodeURIComponent(course)}`);
          const batches = batchListRes.data;
          batches.forEach((batch) => {
            allRooms.push({
              course,
              batch,
              roomPath: `${course}/${batch}/forum/general`,
            });
          });
        }
      }

      setForumRooms(allRooms);

      // Auto-select first forum chat if nothing is selected yet
      if (!selectedTarget && allRooms.length > 0) {
        setChatType("forum");
        setSelectedTarget(allRooms[0].roomPath);
      }
    } catch (err) {
      console.error("❌ Failed to fetch forum chat rooms", err);
    }
  };

  fetchForumChats();
}, []);


  // Fetch Admins
useEffect(() => {
  const fetchAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:5006/chatrooms/admins");
      const cleaned = res.data.map((name) => decodeURIComponent(name));
      setAdmins(cleaned);

      // If no forum chat was auto-selected, fallback to first admin
      if (!selectedTarget && cleaned.length > 0) {
        setChatType("admin");
        setSelectedTarget(cleaned[0]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch admins", err);
    }
  };
  fetchAdmins();
}, []);

useEffect(() => {
  const fetchAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:5006/chatrooms/admins");
      const cleaned = res.data.map((name) => decodeURIComponent(name));
      setAdmins(cleaned);

      const statusRes = await axios.get("http://localhost:5006/chatrooms/admins/status");
      const statusMap = {};
      statusRes.data.forEach(({ name, online }) => {
        statusMap[name] = online;
      });
      setAdminStatus(statusMap);

      // Default selection
      if (!selectedTarget && cleaned.length > 0) {
        setChatType("admin");
        setSelectedTarget(cleaned[0]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch admins or statuses", err);
    }
  };
  fetchAdmins();
}, []);


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

  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const statusRes = await axios.get("http://localhost:5006/chatrooms/admins/status");
      const statusMap = {};
      statusRes.data.forEach(({ name, online }) => {
        statusMap[name] = online;
      });
      setAdminStatus(statusMap);
    } catch (e) {
      console.error("Status polling failed:", e);
    }
  }, 20000); // 20 seconds

  return () => clearInterval(interval);
}, []);

  const sendMessage = () => {
    if (!msg.trim()) return;
    socket.emit("message", { name: sender, room, message: msg });
    setMsg("");
  };

  const selectChat = (type, target) => {
    setChatType(type);
    setSelectedTarget(target);
    setMessages([]);
  };

  const filteredChats = () => {
  if (filterType === "admins") return admins.map((a) => ({ name: a, type: "admin" }));
  if (filterType === "forums")
    return forumRooms
      .filter((r) => courseFilter === "All" || r.course === courseFilter)
      .map((r) => ({ name: `${r.course} → ${r.batch}`, path: r.roomPath, type: "forum" }));

  return [
    ...admins.map((a) => ({ name: a, type: "admin" })),
    ...forumRooms
      .filter((r) => courseFilter === "All" || r.course === courseFilter)
      .map((r) => ({ name: `${r.course} → ${r.batch}`, path: r.roomPath, type: "forum" })),
  ];
};


  return (
    <div className="p-0 m-0 flex h-[89vh] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <div className="w-1/3 h-[92vh] bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto shadow-lg">
        

        {/* Search Bar */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {["All", "Groups", "Admins"].map((filter) => (
  <button
    key={filter}
    onClick={() => setCourseFilter(filter)}
    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      courseFilter === filter
        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    }`}
  >
    {filter}
  </button>
))}

        </div>

        {/* Forum Chats */}
        {["All", "Groups"].includes(courseFilter) && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Forum Groups</h3>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                {forumRooms.length}
              </span>
            </div>
            <div className="space-y-2">
              {forumRooms.map((r) => (
                <button
                  key={r.roomPath}
                  onClick={() => selectChat("forum", r.roomPath)}
                  className={`flex items-center space-x-3 w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                    chatType === "forum" && selectedTarget === r.roomPath
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 shadow-sm"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    chatType === "forum" && selectedTarget === r.roomPath
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                  }`}>
                    <FaUsers className="text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{r.course}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{r.batch}</div>
                  </div>
                  {chatType === "forum" && selectedTarget === r.roomPath && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Admin Chats */}
        {["All", "Admins"].includes(courseFilter) && (
          <>
            <div className="flex items-center justify-between mt-8 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Admins</h3>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                {admins.length}
              </span>
            </div>
            <div className="space-y-2">
              {admins.map((admin) => (
                <button
                  key={admin}
                  onClick={() => selectChat("admin", admin)}
                  className={`flex items-center space-x-3 w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                    chatType === "admin" && selectedTarget === admin
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 shadow-sm"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                      chatType === "admin" && selectedTarget === admin
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-gray-500 to-gray-600 group-hover:from-green-500 group-hover:to-emerald-600"
                    }`}>
                      {admin[0].toUpperCase()}
                    </div>
                    {adminStatus[admin] && (
  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></span>
)}

                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{admin}</div>
                    <div className={`text-sm font-medium ${adminStatus[admin] ? "text-green-500 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
  {adminStatus[admin] ? "Online" : "Offline"}
</div>

                  </div>
                  {chatType === "admin" && selectedTarget === admin && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chat Section */}
      <div className="w-2/3 flex flex-col bg-white dark:bg-gray-800">
        {room ? (
          <>
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                {chatType === "forum" ? (
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaUsers className="text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {selectedTarget[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {chatType === "forum" ? selectedTarget.split("/").slice(0, 2).join(" → ") : selectedTarget}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chatType === "forum" ? "Forum Group" : "Admin • Online"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 space-y-4" ref={chatRef}>
  {messages.map((m, i) => {
    const [name, ...text] = m.split(": ");
    const decodedName = decodeURIComponent(name);
    const isSender = decodedName === sender;
    return (
      <div
        key={i}
        className={`flex ${
          isSender ? "justify-end" : "justify-start"
        }`}
      >
        <div className={`flex flex-col max-w-xs lg:max-w-md ${isSender ? "items-end" : "items-start"}`}>
          {!isSender && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 ml-3">
              {decodedName}
            </div>
          )}
          <div
            className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${
              isSender
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md"
            }`}
          >
            {text.join(": ")}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 mx-3">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  })}
</div>


            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 rounded-2xl p-2">
                <input
                  className="flex-1 bg-transparent text-gray-900 dark:text-white px-4 py-3 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Type your message..."
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!msg.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white p-3 rounded-xl transition-all duration-200 shadow-sm disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to SuperAdmin Chat</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 max-w-md">
              Select a conversation from the sidebar to start chatting with admins or join forum discussions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminChat;
