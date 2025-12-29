# Forgot Password Feature Documentation

## Overview
The Forgot Password feature provides a secure way for users to reset their password through a 3-step OTP verification process.

## How It Works

### Step 1: Email Verification
- User clicks "Forgot password?" link on the login page
- User enters their email address
- System sends a 6-digit OTP to that email
- OTP is valid for 10 minutes

### Step 2: OTP Verification
- User enters the 6-digit OTP received in their email
- User can resend OTP if needed
- System verifies the OTP against the database

### Step 3: Password Reset
- After OTP verification, user sees the password reset form
- User enters:
  - **New Password** (minimum 6 characters)
  - **Confirm Password** (must match new password)
- System updates the password and redirects to login

## Feature Components

### Frontend Components

#### 1. **ForgotPassword.tsx** (`Frontend/src/components/ForgotPassword.tsx`)
- Main component handling the 3-step forgot password flow
- Props: None (uses React Router for navigation)
- State:
  - `step`: Tracks current step ('email' | 'otp' | 'reset-password')
  - `email`: User's email address
  - `passwords`: Object containing newPassword and confirmPassword
  - `showPassword`, `showConfirmPassword`: Toggle password visibility
  - `isLoading`, `error`: Loading and error states

**Key Methods:**
- `handleSendOTP()`: Calls `/auth/send-reset-otp` endpoint
- `handleVerifyOTP()`: Calls `/auth/verify-reset-otp` endpoint
- `handleResetPassword()`: Calls `/auth/reset-password` endpoint
- `handleResendOTP()`: Resends OTP to email
- `handleBack()`: Navigates between steps

#### 2. **OTPVerification.tsx** (Already Exists)
- Reusable component for OTP input with 6 input fields
- Used in forgot password, login, and signup flows
- Props:
  - `email`: User's email (for context)
  - `onVerify`: Callback when user submits OTP
  - `onResend`: Callback to resend OTP
  - `isLoading`: Show loading state
  - `error`: Display error messages
  - `purpose`: 'login' | 'signup' | 'password-reset'

### Backend Routes

#### 1. **POST /auth/send-reset-otp**
**Purpose:** Send OTP to user's email for password reset

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

**Error Cases:**
- Email not provided: 400 Bad Request
- No user found with this email: 400 Bad Request
- Email sending failed: 500 Internal Server Error

---

#### 2. **POST /auth/verify-reset-otp**
**Purpose:** Verify the OTP sent to user's email

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "user@example.com"
}
```

**Error Cases:**
- Email or OTP not provided: 400 Bad Request
- OTP not found or already verified: 400 Bad Request
- OTP expired: 400 Bad Request
- OTP incorrect: 400 Bad Request

---

#### 3. **POST /auth/reset-password**
**Purpose:** Update user's password after OTP verification

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

**Validations:**
- All fields required
- Passwords must match
- Password must be at least 6 characters
- User must exist
- OTP must be verified within expiration time

**Error Cases:**
- Missing fields: 400 Bad Request
- Passwords don't match: 400 Bad Request
- Password too short: 400 Bad Request
- Invalid/expired OTP: 400 Bad Request
- User not found: 400 Bad Request

### Database Schema

#### OTP Model (`Backend/models/otp.js`)
```javascript
{
  email: String (required, indexed),
  otp: String (required),
  purpose: String (enum: 'signup', 'login', 'password-reset', required),
  expiresAt: Date (auto-deletes after expiration, default: 10 minutes),
  verified: Boolean (default: false),
  createdAt: Date (default: now)
}
```

**Indexes:**
- `email` and `purpose` (for faster lookups)
- `expiresAt` (TTL index for auto-deletion)

## User Flow Diagram

```
User (on Login page)
    ↓
Click "Forgot password?" link → Navigate to /forgot-password
    ↓
[Step 1: Email]
    ├→ Enter email
    ├→ Click "Send Verification Code"
    ├→ Backend sends OTP to email
    ├→ Navigate to Step 2
    │
[Step 2: OTP Verification]
    ├→ Receive OTP in email
    ├→ Enter OTP (6 digits)
    ├→ Backend verifies OTP
    ├→ Navigate to Step 3
    │
[Step 3: Reset Password]
    ├→ Enter New Password
    ├→ Enter Confirm Password
    ├→ Click "Reset Password"
    ├→ Backend updates password
    ├→ Show success message
    └→ Redirect to Login page
```

## Testing the Feature

### Test Case 1: Valid Reset Flow
1. Go to Login page
2. Click "Forgot password?"
3. Enter a registered email (e.g., test@example.com)
4. Check your email for OTP
5. Enter the OTP
6. Enter new password and confirm
7. Click "Reset Password"
8. Login with new password

### Test Case 2: Invalid Email
1. Go to Forgot Password
2. Enter non-existent email
3. System shows error: "No user found with this email address"

### Test Case 3: Invalid OTP
1. Complete Step 1
2. Enter incorrect OTP
3. System shows error: "Invalid OTP. Please try again."

### Test Case 4: Expired OTP
1. Complete Step 1
2. Wait 10+ minutes
3. Try to verify OTP
4. System shows error: "OTP has expired. Please request a new one."

### Test Case 5: Password Mismatch
1. Complete Step 2
2. Enter different passwords in "New Password" and "Confirm Password"
3. System shows error: "Passwords do not match"

### Test Case 6: Short Password
1. Complete Step 2
2. Enter password less than 6 characters
3. System shows error: "Password must be at least 6 characters long"

## Security Features

1. **OTP Expiration**: OTP expires after 10 minutes
2. **Single Use**: OTP can only be used once (marked as verified)
3. **Password Hashing**: Passwords are hashed using bcrypt (12 salt rounds)
4. **Email Verification**: Users must have access to their email
5. **Rate Limiting** (Recommended): Can be added to prevent brute force attacks

## UI/UX Features

1. **Progress Bar**: Visual indicator showing which step user is on
2. **Eye Icon Toggle**: Show/hide password fields
3. **Resend OTP**: Option to request new OTP
4. **Back Navigation**: Users can go back to previous steps
5. **Error Messages**: Clear, user-friendly error messages
6. **Loading States**: Shows loading indicator during API calls

## Integration Points

### Links/Buttons that Access This Feature
1. **Login Component** (`Frontend/src/components/Login.tsx`)
   - "Forgot password?" link in the password field area

### Routes
- Frontend: `/forgot-password` → `ForgotPassword.tsx`
- Backend: `/auth/send-reset-otp`, `/auth/verify-reset-otp`, `/auth/reset-password`

## Future Enhancements

1. **Email Templates**: Customize OTP email template
2. **Rate Limiting**: Limit OTP requests per email (e.g., max 5 per hour)
3. **SMS OTP**: Add SMS as alternative to email OTP
4. **Security Questions**: Add optional security questions
5. **Password Strength Meter**: Show password strength indicator
6. **Login After Reset**: Auto-login user after password reset (optional)
7. **Admin Dashboard**: Track password reset attempts
8. **Two-Factor Authentication**: Require additional verification step

## Troubleshooting

### OTP Not Received
- Check spam/junk folder
- Verify email address is correct
- Resend OTP
- Check if email service is configured properly

### Password Reset Failed
- Ensure passwords match
- Ensure password is at least 6 characters
- Check if OTP is still valid (10 minutes)
- Try resending OTP

### Page Not Found
- Ensure route is added to `App.tsx`
- Verify import statement exists
- Clear browser cache and reload

## Environment Variables Required
- `NODE_MAILER_EMAIL`: Email service address
- `NODE_MAILER_PASSWORD`: Email service password
- `NODE_MAILER_SERVICE`: Email service provider (Gmail, SendGrid, etc.)

## File Locations

- **Frontend Component**: `Frontend/src/components/ForgotPassword.tsx`
- **Backend Routes**: `Backend/routes/auth.js`
- **OTP Model**: `Backend/models/otp.js`
- **User Model**: `Backend/models/user.js`
- **Email Service**: `Backend/utils/emailService.js`
- **Route in App**: `Frontend/src/App.tsx`
