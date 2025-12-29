# Forgot Password Feature - Visual Guide

## Screen 1: Email Entry

```
╔════════════════════════════════╗
║         [X]                    ║
║  BUYONIX                       ║
║  Reset Password                ║
║  Enter your email to receive   ║
║  a verification code           ║
║                                ║
║  ████░░░░░░░░░░░░░░░░░░░░░    ║ (Progress: Step 1/3)
║                                ║
║  Email Address                 ║
║  ┌─────────────────────────┐   ║
║  │ user@example.com        │   ║
║  └─────────────────────────┘   ║
║                                ║
║  ┌─────────────────────────┐   ║
║  │ Send Verification Code  │   ║
║  └─────────────────────────┘   ║
║                                ║
║  ┌─────────────────────────┐   ║
║  │    Back to Login        │   ║
║  └─────────────────────────┘   ║
║                                ║
╚════════════════════════════════╝

User Actions:
1. Enter registered email
2. Click "Send Verification Code"
3. Check email for OTP
```

## Screen 2: OTP Verification

```
╔════════════════════════════════╗
║         [X]                    ║
║  BUYONIX                       ║
║  Verify Email                  ║
║  Enter the code sent to        ║
║  your email                    ║
║                                ║
║  ██████░░░░░░░░░░░░░░░░░░░░    ║ (Progress: Step 2/3)
║                                ║
║  Verification Code             ║
║  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐║
║  │1 │ │2 │ │3 │ │4 │ │5 │ │6 ││
║  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘║
║                                ║
║  ┌─────────────────────────┐   ║
║  │     Verify OTP          │   ║
║  └─────────────────────────┘   ║
║                                ║
║  Didn't receive OTP?           ║
║  [Resend OTP]                  ║
║                                ║
║  ┌─────────────────────────┐   ║
║  │    Back                 │   ║
║  └─────────────────────────┘   ║
║                                ║
╚════════════════════════════════╝

User Actions:
1. Receive OTP email
2. Enter 6-digit OTP
3. Click "Verify OTP" or "Resend OTP"
```

## Screen 3: Password Reset

```
╔════════════════════════════════╗
║         [X]                    ║
║  BUYONIX                       ║
║  Set New Password              ║
║  Create a new password for     ║
║  your account                  ║
║                                ║
║  ████████░░░░░░░░░░░░░░░░░░    ║ (Progress: Step 3/3)
║                                ║
║  New Password                  ║
║  ┌─────────────────────────┐   ║
║  │ ••••••••••••  [👁]      │   ║
║  └─────────────────────────┘   ║
║  Password must be at least     ║
║  6 characters                  ║
║                                ║
║  Confirm Password              ║
║  ┌─────────────────────────┐   ║
║  │ ••••••••••••  [👁]      │   ║
║  └─────────────────────────┘   ║
║                                ║
║  ┌─────────────────────────┐   ║
║  │   Reset Password        │   ║
║  └─────────────────────────┘   ║
║                                ║
║  ┌─────────────────────────┐   ║
║  │    Back                 │   ║
║  └─────────────────────────┘   ║
║                                ║
╚════════════════════════════════╝

User Actions:
1. Enter new password (min 6 characters)
2. Confirm password (must match)
3. Click "Reset Password"
4. Redirected to Login page
```

## Success Flow

```
          Start
            ↓
      [Email Screen]
            ↓
    Enter Email & Click Send
            ↓
   Check Email for OTP
            ↓
      [OTP Screen]
            ↓
     Enter OTP & Verify
            ↓
   [Password Reset Screen]
            ↓
  Enter New Password & Confirm
            ↓
    Click "Reset Password"
            ↓
   Password Updated ✓
            ↓
  Redirect to Login
            ↓
        Login with
      New Password
```

## Error Scenarios

### Invalid Email
```
┌─────────────────────────┐
│ Email not found error   │
│ No user found with      │
│ this email address      │
│                         │
│ [Try Again]             │
└─────────────────────────┘
```

### Invalid OTP
```
┌─────────────────────────┐
│ OTP Verification Error  │
│ Invalid OTP.            │
│ Please try again.       │
│                         │
│ [Resend OTP]            │
└─────────────────────────┘
```

### Password Mismatch
```
┌─────────────────────────┐
│ Password Mismatch Error │
│ Passwords do not match  │
│                         │
│ [Try Again]             │
└─────────────────────────┘
```

### OTP Expired
```
┌─────────────────────────┐
│ OTP Expired             │
│ OTP has expired.        │
│ Please request a new one│
│                         │
│ [Back to Email Screen]  │
└─────────────────────────┘
```

## API Flow (Backend)

```
Frontend                          Backend
   │                               │
   ├─ POST /auth/send-reset-otp ──>
   │  {email}                       │
   │                        Generate OTP
   │                        Send Email
   │<────────── {success} ──────────┤
   │
   ├─ POST /auth/verify-reset-otp ─>
   │  {email, otp}                  │
   │                        Verify OTP
   │                        Mark as verified
   │<────────── {success} ──────────┤
   │
   ├─ POST /auth/reset-password ───>
   │  {email, newPassword, ...}     │
   │                        Hash Password
   │                        Update User
   │                        Delete OTP
   │<────────── {success} ──────────┤
   │
   └─ Redirect to /login
```

## Timeline

```
T=0s    : User clicks "Forgot Password"
T=1s    : User enters email and sends OTP
T=2-10s : Email delivered with OTP
T=11s   : User enters OTP
T=12s   : System verifies OTP
T=13s   : Password reset form displayed
T=14s   : User enters new password
T=15s   : Password updated successfully
T=16s   : Redirected to login page
T=17s   : User logs in with new password

Note: OTP is valid for 10 minutes (600 seconds)
```

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Email Verification** | User must own the email to reset password |
| **OTP** | 6-digit code valid for 10 minutes |
| **Password Requirements** | Minimum 6 characters |
| **Password Confirmation** | Must match for security |
| **Show/Hide Password** | Eye icon to toggle password visibility |
| **Resend OTP** | User can request new OTP |
| **Progress Bar** | Visual indicator of progress through 3 steps |
| **Error Handling** | Clear error messages for each scenario |
| **Back Navigation** | Users can go back to previous steps |
| **Auto-Delete OTP** | Used OTP automatically deleted after reset |

## Integration with Existing Login

```
┌──────────────────────────┐
│     Login Page           │
│                          │
│ Email: [______]          │
│ Password: [______] [👁]  │
│                          │
│ [Sign In]                │
│                          │
│ ─────────────────────────│
│ Forgot Password? ◄── NEW │
│                          │
│ [Google Sign In]         │
│                          │
│ Sign up [link]           │
└──────────────────────────┘
```

The "Forgot Password?" link points to `/forgot-password` route.
