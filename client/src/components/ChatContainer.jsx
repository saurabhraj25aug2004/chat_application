import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext, useChat } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
  } = useContext(ChatContext);

  const { authUser, onlineUsers, axios } = useContext(AuthContext);
  const { selectedChat, setSelectedChat, setChats } = useChat();

  const [input, setInput] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const scrollEnd = useRef();

  useEffect(() => {
    if (selectedChat?.isGroupChat && selectedChat?._id) {
      getMessages(selectedChat._id);
    } else if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, selectedChat]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this group?");
    if (!confirmDelete) return;

    try {
      const { data } = await axios.delete(`/api/chat/group/${selectedChat._id}`);
      if (data.success) {
        toast.success("Group deleted successfully");
        setSelectedChat(null);
        setChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
      } else {
        toast.error(data.message || "Failed to delete group");
      }
    } catch (error) {
      toast.error("Something went wrong while deleting the group");
      console.error("Delete group error:", error);
    }
  };

  const imageSrc =
    previewImage ||
    (selectedChat?.isGroupChat
      ? assets.group_icon
      : selectedUser?.profilePic || assets.avatar_icon);

  if (!selectedUser && !selectedChat) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} className="max-w-16" alt="logo" />
        <p className="text-lg font-medium text-white">No limits. Just messages</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* --- Header --- */}
      <div className="flex items-center justify-between gap-3 py-3 mx-4 border-b border-stone-500">
        <div className="flex items-center gap-3">
          <div className="relative w-fit group">
            <img
              src={imageSrc}
              alt="avatar"
              className="w-8 h-8 object-cover rounded-full cursor-pointer"
            />
            <label className="absolute bottom-0 right-0 bg-black bg-opacity-50 p-0.5 rounded-full text-white text-xs hidden group-hover:block cursor-pointer">
              📷
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-lg text-white flex items-center gap-2">
            {selectedChat?.isGroupChat
              ? selectedChat?.chatName
              : selectedUser?.fullName}
            {(selectedUser?.fullName && onlineUsers.includes(selectedUser?._id)) && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedChat?.isGroupChat && (
            <button
              onClick={() => setShowMembers(prev => !prev)}
              className="text-xs text-blue-400 hover:underline"
            >
              {showMembers ? "Hide Members" : "Show Members"}
            </button>
          )}

          {selectedChat?.isGroupChat && selectedChat?.groupAdmin === authUser?._id && (
            <button
              onClick={handleDeleteGroup}
              className="text-red-400 hover:text-red-600 text-xs underline"
            >
              Delete Group
            </button>
          )}
          <img
            onClick={() => {
              setSelectedUser(null);
              setSelectedChat(null);
            }}
            src={assets.arrow_icon}
            alt="Back"
            className="md:hidden max-w-7 cursor-pointer"
          />
        </div>
      </div>

      {/* --- Show Group Members --- */}
      {showMembers && selectedChat?.isGroupChat && (
        <div className="px-4 py-2 bg-[#282142] text-white text-sm">
          <p className="mb-1 font-semibold">Members:</p>
          <ul className="pl-4 list-disc">
            {selectedChat?.users?.map((user) => (
              <li key={user._id}>
                {user.fullName} {user._id === selectedChat.groupAdmin && "(Admin)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Chat Messages --- */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, index) => {
  const isSender = (msg.senderId._id || msg.senderId) === authUser._id;
  const senderName = msg.senderId?.fullName || "User";

  return (
    <div
      key={index}
      className={`flex items-end gap-2 my-2 ${
        isSender ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar and timestamp */}
      {!isSender && (
        <div className="flex flex-col items-center">
          <img
            src={
              selectedUser?.profilePic ||
              selectedChat?.groupAdmin?.profilePic ||
              assets.avatar_icon
            }
            alt="profile"
            className="w-7 h-7 rounded-full"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            {formatMessageTime(msg.createdAt)}
          </p>
        </div>
      )}

      {/* Message bubble */}
      <div className="max-w-[230px]">
        {selectedChat?.isGroupChat && !isSender && (
          <p className="text-xs text-gray-300 font-semibold mb-1">
            {senderName}
          </p>
        )}

        {msg.image ? (
          <img
            src={msg.image}
            alt="chat-img"
            className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden"
          />
        ) : (
          <p
            className={`p-2 text-sm font-light rounded-lg break-words text-white ${
              isSender
                ? "bg-violet-600 rounded-br-none"
                : "bg-violet-500/40 rounded-bl-none"
            }`}
          >
            {msg.text}
          </p>
        )}

        {/* Timestamp for sender (on right side) */}
        {isSender && (
          <p className="text-[10px] text-gray-400 text-right mt-1">
            {formatMessageTime(msg.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
})}

        <div ref={scrollEnd}></div>
      </div>

      {/* --- Input Area --- */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Send a message"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt="Upload"
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt="Send"
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ChatContainer;
