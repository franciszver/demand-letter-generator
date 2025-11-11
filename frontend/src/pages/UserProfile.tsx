import React from 'react';
import { useNavigate } from 'react-router-dom';
import EQDataForm from '../components/EQDataForm';
import { useState } from 'react';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Profile</h1>
        <p className="text-gray-600 mt-2">Manage your communication preferences and EQ settings</p>
      </div>

      <EQDataForm userId={user.id} mode="user-profile" />
    </div>
  );
};

export default UserProfile;

