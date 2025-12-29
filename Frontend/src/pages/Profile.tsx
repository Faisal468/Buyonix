import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone,  FaEdit } from 'react-icons/fa';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userInfo);
    setUserData(user);
    setFormData({
      displayName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setIsLoading(false);
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    setError('');
    setSuccess('');

    if (!formData.displayName || !formData.email) {
      setError('Name and email are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setUserData(result.user);
        
        // Update localStorage
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        window.dispatchEvent(new Event('userProfileUpdated'));
        
        setIsEditing(false);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600"
            >
              <FaEdit /> {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-4xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{userData?.displayName}</h2>
              <p className="text-gray-600">Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Recently'}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUser className="inline mr-2" /> Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              ) : (
                <p className="text-gray-800 text-lg font-medium">{userData?.displayName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaEnvelope className="inline mr-2" /> Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              ) : (
                <p className="text-gray-800 text-lg font-medium">{userData?.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaPhone className="inline mr-2" /> Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              ) : (
                <p className="text-gray-800 text-lg font-medium">
                  {userData?.phone || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-8 pt-6 border-t flex gap-4">
              <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className={`flex-1 bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    displayName: userData?.displayName || '',
                    email: userData?.email || '',
                    phone: userData?.phone || '',
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Account Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-teal-50 p-4 rounded-md">
              <p className="text-gray-600 text-sm">Account Status</p>
              <p className="text-2xl font-bold text-teal-600 mt-2">Active</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-gray-600 text-sm">Verified Email</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">✓</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
