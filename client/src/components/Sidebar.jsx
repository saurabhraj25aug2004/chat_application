import React, { useContext, useEffect, useState } from 'react';
import assets from './../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import { useChat } from '../../context/ChatContext';
import GroupChatModal from './GroupChatModal';
import axios from 'axios';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages } = useContext(ChatContext);
  const { chats, selectedChat, setSelectedChat, setChats } = useChat();
  const { logout, onlineUsers, authUser } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter(user => user.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div className={`bg-[#8185b2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`}>
      
      {/* Logo and Menu */}
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="logo" className='max-w-40' />
          <div className='relative py-2 group'>
            <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
            <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
              <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
              <hr className='my-2 border-t border-gray-500' />
              <p onClick={logout} className='cursor-pointer text-sm'>Logout</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-4'>
          <img src={assets.search_icon} alt="search" className='w-3' />
          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
            placeholder='Search User...'
          />
        </div>
      </div>

      {/* Create Group Button */}
      <div className="mb-4 mt-2">
        <button
          onClick={() => setShowGroupModal(true)}
          className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded text-sm"
        >
          + Create Group
        </button>
      </div>

      {/* Chats List */}
      <div className="mb-4">
        <h3 className="text-sm text-gray-300 mb-2">Chats</h3>
        {chats?.map(chat => {
          const isGroup = chat.isGroupChat;
          const otherUser = isGroup
            ? null
            : chat.users.find(user => user._id !== authUser?._id);

          return (
            <div
              key={chat._id}
              className="flex justify-between items-center px-3 py-2 rounded-md hover:bg-[#282142]/40"
            >
              <div
                onClick={() => {
                  if (isGroup) {
                    setSelectedChat(chat);
                    setSelectedUser(null);
                  } else {
                    setSelectedUser(otherUser);
                    setSelectedChat(null);
                    setUnseenMessages(prev => ({ ...prev, [otherUser._id]: 0 }));
                  }
                }}
                className={`flex-1 cursor-pointer ${
                  selectedChat?._id === chat._id || selectedUser?._id === otherUser?._id
                    ? 'bg-[#282142]/50'
                    : ''
                }`}
              >
                {isGroup ? chat.chatName : otherUser?.fullName || 'Private Chat'}
              </div>

              {/* Delete Group Button (Only for group admin) */}
              {isGroup && chat.groupAdmin?._id === authUser?._id && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirmDelete = window.confirm("Are you sure you want to delete this group?");
                    if (!confirmDelete) return;

                    try {
                      const { data } = await axios.delete(`/api/chat/${chat._id}`);

                      if (data.success) {
                        toast.success("Group deleted");
                        setChats(prev => prev.filter(c => c._id !== chat._id));
                        if (selectedChat?._id === chat._id) {
                          setSelectedChat(null);
                        }
                      } else {
                        toast.error(data.message || "Delete failed");
                      }
                    } catch (error) {
                      console.error("Group delete error:", error);
                      toast.error("Something went wrong");
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-600 ml-2"
                >
                  🗑
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Users List */}
      <div className='flex flex-col'>
        {filteredUsers.map((user, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedUser(user);
              setSelectedChat(null);
              setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer ${
              selectedUser?._id === user._id && 'bg-[#282142]/50'
            }`}
          >
            <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-[35px] aspect-[1/1] rounded-full' />
            <div className='flex flex-col leading-5'>
              <p>{user.fullName}</p>
              <span className={`text-xs ${onlineUsers.includes(user._id) ? 'text-green-400' : 'text-neutral-400'}`}>
                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
              </span>
            </div>
            {unseenMessages[user._id] > 0 && (
              <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Group Modal */}
      {showGroupModal && <GroupChatModal onClose={() => setShowGroupModal(false)} />}
    </div>
  );
};

export default Sidebar;
