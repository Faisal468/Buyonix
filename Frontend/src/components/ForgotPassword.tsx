import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../assets/logo.png';
import OTPVerification from './OTPVerification';

type Step = 'email' | 'otp' | 'reset-password';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/auth/send-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('otp');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/auth/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const result = await response.json();

      if (result.success) {
        setOtp(otpCode); // Store OTP for password reset
        setStep('reset-password');
      } else {
        setError(result.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Trim values to remove whitespace
    const newPass = passwords.newPassword.trim();
    const confirmPass = passwords.confirmPassword.trim();

    // Validation
    if (!newPass || !confirmPass) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPass.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otp, // Use the stored OTP from verification
          newPassword: newPass,
          confirmPassword: confirmPass,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show success message and redirect to login
        alert('Password reset successfully! Please login with your new password.');
        navigate('/login');
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/auth/send-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'email') {
      navigate('/login');
    } else if (step === 'otp') {
      setStep('email');
      setError('');
    } else if (step === 'reset-password') {
      setStep('otp');
      setError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={() => navigate('/login')}
        >
          <span className="text-2xl">&times;</span>
        </button>

        {/* Logo and title */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="BUYONIX Logo" className="h-12 w-12 object-contain mb-2" />
          <h2 className="text-xl font-semibold text-gray-800">
            {step === 'email' && 'Reset Password'}
            {step === 'otp' && 'Verify Email'}
            {step === 'reset-password' && 'Set New Password'}
          </h2>
          <p className="text-gray-600 text-sm text-center">
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'otp' && 'Enter the code sent to your email'}
            {step === 'reset-password' && 'Create a new password for your account'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-between mb-6">
          <div className={`flex-1 h-1 rounded-full mx-1 ${step === 'email' || step === 'otp' || step === 'reset-password' ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
          <div className={`flex-1 h-1 rounded-full mx-1 ${step === 'otp' || step === 'reset-password' ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
          <div className={`flex-1 h-1 rounded-full mx-1 ${step === 'reset-password' ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600 active:bg-teal-700 active:scale-95 transition duration-200 mb-4 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Sending OTP...' : 'Send Verification Code'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-teal-600 py-2 rounded-md hover:bg-teal-50 border border-teal-200 transition duration-200"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <div>
            <OTPVerification
              email={email}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              isLoading={isLoading}
              error={error}
              purpose="password-reset"
            />
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-teal-600 py-2 rounded-md hover:bg-teal-50 border border-teal-200 transition duration-200 mt-4"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset-password' && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600 active:bg-teal-700 active:scale-95 transition duration-200 mb-4 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-teal-600 py-2 rounded-md hover:bg-teal-50 border border-teal-200 transition duration-200"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
