import React, { useState, useEffect, useContext } from "react";
import { useChat } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { IoClose } from "react-icons/io5";

const GroupChatModal = ({ onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [users, setUsers] = useState([]);

  const { setChats } = useChat();
  const { axios } = useContext(AuthContext);

  const handleUserToggle = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedUserIds.length < 2) {
      alert("Please provide a group name and select at least two users.");
      return;
    }
    try {
      const { data } = await axios.post('/api/chat/group', {
        name: groupName,
        users: selectedUserIds,
      });
      setChats(prev => [data, ...prev]);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await axios.get('/api/messages/users');
      if (data.success) setUsers(data.users);
    };
    fetchUsers();
  }, []);

  return (
    <div className="absolute left-10 top-10 z-50 p-6 w-72 bg-[#1f1b35] rounded-xl shadow-lg text-white border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Create Group</h2>
        <IoClose onClick={onClose} className="cursor-pointer text-xl hover:text-red-400" />
      </div>
      <input
        type="text"
        placeholder="Group Name"
        className="w-full px-3 py-2 mb-4 rounded bg-[#282142] text-white placeholder-gray-400 outline-none"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
        {users.map((user) => (
          <label key={user._id} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selectedUserIds.includes(user._id)}
              onChange={() => handleUserToggle(user._id)}
              className="accent-purple-500"
            />
            {user.fullName}
          </label>
        ))}
      </div>
      <div className="flex justify-between">
        <button
          onClick={handleSubmit}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
        <button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GroupChatModal;
