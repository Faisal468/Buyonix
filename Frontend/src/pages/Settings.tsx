import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCog, FaLock, FaBell, FaShieldAlt, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'privacy' | 'danger'>('security');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    productRecommendations: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    showOrderHistory: false,
  });

  // Check if user is logged in
  React.useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
    }
  }, [navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setMessage('Notification preferences updated');
    setTimeout(() => setMessage(''), 2000);
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: any) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
    setMessage('Privacy settings updated');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:5000/auth/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const result = await response.json();

        if (result.success) {
          localStorage.removeItem('userInfo');
          localStorage.removeItem('isLoggedIn');
          navigate('/login');
        } else {
          setError(result.message || 'Failed to delete account');
        }
      } catch (error) {
        console.error('Delete account error:', error);
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaCog className="text-teal-500" /> Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and security</p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-6 py-4 border-l-4 transition ${
                  activeTab === 'security'
                    ? 'bg-teal-50 border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaLock /> Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-6 py-4 border-l-4 transition ${
                  activeTab === 'notifications'
                    ? 'bg-teal-50 border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaBell /> Notifications
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-6 py-4 border-l-4 transition ${
                  activeTab === 'privacy'
                    ? 'bg-teal-50 border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaShieldAlt /> Privacy
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`w-full flex items-center gap-3 px-6 py-4 border-l-4 transition ${
                  activeTab === 'danger'
                    ? 'bg-red-50 border-red-500 text-red-600'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaTrash /> Danger Zone
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3">
            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaLock /> Security Settings
                </h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Enter your current password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Use a strong password with uppercase, lowercase, numbers, and special characters for better security.
                  </p>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaBell /> Notification Preferences
                </h2>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates' },
                    { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about order status' },
                    { key: 'promotions', label: 'Promotions', desc: 'Receive promotional emails' },
                    { key: 'productRecommendations', label: 'Product Recommendations', desc: 'Get personalized product suggestions' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-800">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                          className="w-5 h-5 text-teal-500 rounded focus:ring-2 focus:ring-teal-500"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaShieldAlt /> Privacy Settings
                </h2>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Profile Visibility
                    </label>
                    <div className="space-y-2">
                      {['private', 'friends', 'public'].map(option => (
                        <label key={option} className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={option}
                            checked={privacy.profileVisibility === option}
                            onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                            className="w-4 h-4 text-teal-500"
                          />
                          <span className="ml-3 text-gray-700 capitalize font-medium">{option}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {option === 'private' && '(Only you can see your profile)'}
                            {option === 'friends' && '(Only your friends can see)'}
                            {option === 'public' && '(Everyone can see your profile)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Show Order History */}
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <p className="font-medium text-gray-800">Show Order History</p>
                      <p className="text-sm text-gray-600">Allow others to see your purchase history</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showOrderHistory}
                        onChange={(e) => handlePrivacyChange('showOrderHistory', e.target.checked)}
                        className="w-5 h-5 text-teal-500 rounded focus:ring-2 focus:ring-teal-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="bg-red-50 rounded-lg border-2 border-red-200 p-6">
                <h2 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-2">
                  <FaTrash /> Danger Zone
                </h2>

                <div className="bg-white rounded-md p-6 border-2 border-red-300">
                  <h3 className="text-lg font-bold text-red-800 mb-2">Delete Account</h3>
                  <p className="text-gray-700 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>

                  <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6">
                    <p className="text-sm text-red-800">
                      ⚠️ <strong>Warning:</strong> All your data will be permanently deleted, including:
                      <ul className="list-disc list-inside mt-2 ml-2">
                        <li>Profile information</li>
                        <li>Order history</li>
                        <li>Wishlist</li>
                        <li>Saved addresses</li>
                      </ul>
                    </p>
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className={`w-full bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 transition ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'Deleting...' : 'Delete Account Permanently'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
