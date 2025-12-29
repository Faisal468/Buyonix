# Forgot Password Feature - Quick Start Guide

## What Was Implemented

A complete 3-step forgot password feature that allows users to securely reset their password through email OTP verification.

## How Users Use It

### Step 1: Click Forgot Password
1. User goes to Login page
2. Clicks "Forgot password?" link (next to password field)
3. Enters their email address
4. Clicks "Send Verification Code"

### Step 2: Verify OTP
1. User receives email with 6-digit OTP
2. Enters the OTP in the verification form
3. Can resend OTP if needed
4. Clicks "Verify OTP"

### Step 3: Set New Password
1. User enters new password (min 6 characters)
2. Confirms new password (must match)
3. Clicks "Reset Password"
4. Redirected to Login page
5. Logs in with new password

## What Was Created/Modified

### New Files Created
```
Frontend/src/components/ForgotPassword.tsx
  └─ Main component for forgot password flow
  
FORGOT_PASSWORD_FEATURE.md
  └─ Complete technical documentation
  
FORGOT_PASSWORD_VISUAL_GUIDE.md
  └─ UI/UX visual guide and diagrams
```

### Files Modified
```
Frontend/src/App.tsx
  └─ Added ForgotPassword import and route

Backend/routes/auth.js
  └─ Added 3 new endpoints:
     • POST /auth/send-reset-otp
     • POST /auth/verify-reset-otp
     • POST /auth/reset-password

Backend/models/otp.js
  └─ Updated enum to include 'password-reset' purpose
```

## Backend Endpoints

All requests should be sent to `http://localhost:5000/auth/`

### 1. Send OTP
```
POST /auth/send-reset-otp
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}

Response (Error):
{
  "success": false,
  "message": "No user found with this email address"
}
```

### 2. Verify OTP
```
POST /auth/verify-reset-otp
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "otp": "123456"
}

Response (Success):
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "user@example.com"
}

Response (Error):
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

### 3. Reset Password
```
POST /auth/reset-password
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}

Response (Success):
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}

Response (Error):
{
  "success": false,
  "message": "Passwords do not match"
}
```

## Testing Checklist

- [ ] Click "Forgot password?" link on Login page
- [ ] Enter valid email and send OTP
- [ ] Check email received OTP
- [ ] Enter correct OTP
- [ ] Verify OTP successfully
- [ ] Enter new password and confirm
- [ ] Reset password successfully
- [ ] Login with new password
- [ ] Test invalid email error
- [ ] Test invalid OTP error
- [ ] Test expired OTP error
- [ ] Test password mismatch error
- [ ] Test short password error
- [ ] Test resend OTP functionality
- [ ] Test back button navigation

## Important Notes

### Security Features
✓ OTP expires after 10 minutes  
✓ Passwords are hashed with bcrypt (12 salt rounds)  
✓ Email verification required  
✓ OTP is single-use only  
✓ Password must be at least 6 characters  

### User Experience
✓ 3-step progress bar  
✓ Clear error messages  
✓ Loading indicators  
✓ Show/hide password toggle  
✓ Resend OTP option  
✓ Back navigation support  

### Email Service
Make sure your email service is properly configured in `Backend/utils/emailService.js`  
The OTP will be sent using this service.

## Database Changes

The OTP model now supports three purposes:
- `signup` - For new user registration
- `login` - For login verification
- `password-reset` - For password reset (NEW)

Each OTP:
- Expires after 10 minutes
- Is auto-deleted on expiration
- Can only be used once
- Is tied to a specific email and purpose

## Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/forgot-password` | ForgotPassword.tsx | Forgot password flow |
| `/login` | Login.tsx | Login with "Forgot password?" link |

## Component Props

### ForgotPassword Component
- No props required
- Uses React Router for navigation
- Uses localStorage for temporary data

### OTPVerification Component (Reused)
```typescript
interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  error: string;
  purpose: 'login' | 'signup' | 'password-reset';
}
```

## Styling

The component uses Tailwind CSS with:
- `bg-teal-500` for primary buttons (matches existing theme)
- `border-red-200` for error messages
- `bg-gray-100` for modal background
- Responsive design for mobile and desktop

## Error Handling

The feature handles these error scenarios:
1. **Email not found** → "No user found with this email address"
2. **Invalid OTP** → "Invalid OTP. Please try again."
3. **Expired OTP** → "OTP has expired. Please request a new one."
4. **Passwords don't match** → "Passwords do not match"
5. **Short password** → "Password must be at least 6 characters long"
6. **Network error** → "Network error. Please check your connection..."

## Troubleshooting

### OTP Not Being Sent
- Check if email service is configured
- Verify email address is correct
- Check backend logs for email service errors
- Ensure user exists in database

### Can't Verify OTP
- Check if OTP is correct (case-sensitive)
- Check if OTP hasn't expired (10 minutes)
- Ensure email matches the one used to send OTP

### Can't Reset Password
- Ensure passwords match exactly
- Ensure password is at least 6 characters
- Check if OTP is still valid
- Try starting the process again

## Future Enhancements Suggested

1. Add rate limiting (max 5 OTP requests per hour)
2. Add email template customization
3. Add SMS OTP as alternative
4. Add password strength meter
5. Add login history tracking
6. Add suspicious activity alerts
7. Integrate with 2FA systems
8. Add backup codes

## Support

For technical issues:
1. Check the full documentation: `FORGOT_PASSWORD_FEATURE.md`
2. Check the visual guide: `FORGOT_PASSWORD_VISUAL_GUIDE.md`
3. Review backend logs for API errors
4. Check browser console for frontend errors
5. Verify all routes are added to `App.tsx`

## Integration Summary

```
Login Page
    ↓
"Forgot password?" link
    ↓
/forgot-password route
    ↓
ForgotPassword.tsx component
    ↓
Backend API endpoints
    ↓
OTP Model (database)
    ↓
Email Service
    ↓
User receives OTP
    ↓
Password Reset Complete
    ↓
Redirect to Login
```

---

**Status**: ✅ COMPLETE AND READY TO USE

All files have been created and integrated. The feature is ready for testing!
