# Forgot Password Feature - Code Implementation Details

## File Changes Summary

### 1. Frontend: App.tsx Changes

**Location**: `Frontend/src/App.tsx`

**What Changed**:
- Added ForgotPassword component import
- Added `/forgot-password` route

**Code Changes**:
```tsx
// Line 4: Added import
import ForgotPassword from './components/ForgotPassword';

// Inside Routes (after login route):
<Route path="/forgot-password" element={<ForgotPassword />} />
```

---

### 2. Frontend: New Component - ForgotPassword.tsx

**Location**: `Frontend/src/components/ForgotPassword.tsx`

**What It Does**:
- Manages the 3-step forgot password flow
- Step 1: Email input
- Step 2: OTP verification
- Step 3: Password reset

**Key State Variables**:
```tsx
const [step, setStep] = useState<Step>('email');
const [email, setEmail] = useState('');
const [passwords, setPasswords] = useState({
  newPassword: '',
  confirmPassword: '',
});
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
```

**Key Functions**:
1. `handleSendOTP()` - Sends OTP to email
2. `handleVerifyOTP()` - Verifies OTP entered by user
3. `handleResetPassword()` - Updates password in database
4. `handleResendOTP()` - Resends OTP if user didn't receive it
5. `handleBack()` - Navigate between steps

---

### 3. Backend: auth.js Route Changes

**Location**: `Backend/routes/auth.js`

**What Changed**:
- Added 3 new POST endpoints
- Each endpoint handles a step of the forgot password flow

#### Endpoint 1: Send Reset OTP
```javascript
router.post("/send-reset-otp", async (req, res) => {
  // 1. Validate email
  // 2. Check if user exists
  // 3. Generate 6-digit OTP
  // 4. Delete old OTPs for this email
  // 5. Create new OTP in database
  // 6. Send OTP via email
  // 7. Return response
});
```

**Process**:
- Validates that email is provided
- Checks if user with that email exists
- Generates random 6-digit OTP
- Saves OTP to database with 10-minute expiration
- Sends email via emailService
- Returns success/error response

---

#### Endpoint 2: Verify Reset OTP
```javascript
router.post("/verify-reset-otp", async (req, res) => {
  // 1. Validate email and OTP
  // 2. Find OTP in database
  // 3. Check if OTP is expired
  // 4. Verify OTP matches
  // 5. Mark OTP as verified
  // 6. Return response
});
```

**Process**:
- Validates that email and OTP are provided
- Finds OTP record in database
- Checks expiration time
- Compares user-entered OTP with stored OTP
- Marks OTP as verified (for password reset)
- Does NOT delete OTP yet (needed for reset endpoint)

---

#### Endpoint 3: Reset Password
```javascript
router.post("/reset-password", async (req, res) => {
  // 1. Validate all fields
  // 2. Check passwords match
  // 3. Check password length
  // 4. Verify OTP is marked as verified
  // 5. Check OTP is not expired
  // 6. Find user
  // 7. Hash new password
  // 8. Update user password
  // 9. Delete OTP from database
  // 10. Return response
});
```

**Process**:
- Validates all required fields
- Checks if passwords match
- Checks password is at least 6 characters
- Verifies OTP exists and is marked as verified
- Checks OTP hasn't expired
- Finds user by email
- Hashes new password using bcrypt
- Updates user's password in database
- Deletes OTP from database
- Redirects user to login

---

### 4. Backend: OTP Model Changes

**Location**: `Backend/models/otp.js`

**What Changed**:
- Updated `purpose` enum to include `'password-reset'`

**Before**:
```javascript
purpose: {
  type: String,
  enum: ['signup', 'login'],
  required: true,
},
```

**After**:
```javascript
purpose: {
  type: String,
  enum: ['signup', 'login', 'password-reset'],
  required: true,
},
```

**Schema Structure** (unchanged):
```javascript
{
  email: String (indexed),
  otp: String,
  purpose: String,
  expiresAt: Date (auto-deletes after 10 minutes),
  verified: Boolean,
  createdAt: Date
}
```

---

## API Request/Response Examples

### Request 1: Send OTP
```bash
POST http://localhost:5000/auth/send-reset-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "message": "No user found with this email address"
}
```

---

### Request 2: Verify OTP
```bash
POST http://localhost:5000/auth/verify-reset-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "user@example.com"
}
```

**Error Responses** (400):
```json
{
  "success": false,
  "message": "Invalid or expired OTP. Please request a new one."
}
```

---

### Request 3: Reset Password
```bash
POST http://localhost:5000/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

**Error Responses** (400):
```json
{
  "success": false,
  "message": "Passwords do not match"
}
```

---

## Database Changes

### OTP Collection Changes

**New Documents Created**:
- Type: `password-reset`
- Example document:
```json
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "password-reset",
  "expiresAt": ISODate("2024-12-29T12:10:00Z"),
  "verified": false,
  "createdAt": ISODate("2024-12-29T12:00:00Z")
}
```

**No Schema Changes Required**:
- Just the enum addition for `purpose` field

---

## Component Integration Flow

```
ForgotPassword.tsx
├── handleSendOTP()
│   └── POST /auth/send-reset-otp
│       └── OTP saved to database
│       └── Email sent
│
├── handleVerifyOTP()
│   └── POST /auth/verify-reset-otp
│       └── OTP marked as verified
│
└── handleResetPassword()
    └── POST /auth/reset-password
        └── User password hashed
        └── User document updated
        └── OTP deleted
```

---

## Error Handling Flow

```
Frontend Error Cases:
├── Email not found
│   └── Backend returns 400
│   └── Frontend displays: "No user found with this email address"
│
├── Invalid OTP
│   └── Backend returns 400
│   └── Frontend displays: "Invalid OTP. Please try again."
│
├── Expired OTP
│   └── Backend returns 400
│   └── Frontend displays: "OTP has expired. Please request a new one."
│
├── Password mismatch
│   └── Frontend validation
│   └── Frontend displays: "Passwords do not match"
│
├── Short password
│   └── Frontend validation
│   └── Frontend displays: "Password must be at least 6 characters long"
│
└── Network error
    └── Frontend catch block
    └── Frontend displays: "Network error. Please check your connection..."
```

---

## Security Implementation

### Password Hashing
```javascript
// In reset-password endpoint
const hashedPassword = await bcrypt.hash(newPassword, 12);
user.password = hashedPassword;
await user.save();
```

### OTP Expiration
```javascript
// OTP expires after 10 minutes
expiresAt: new Date(Date.now() + 10 * 60 * 1000)

// MongoDB TTL index auto-deletes
index: { expireAfterSeconds: 0 }
```

### OTP Single Use
```javascript
// Mark as verified after checking
otpRecord.verified = true;
await otpRecord.save();

// Delete after successful password reset
await OTP.deleteOne({ _id: otpRecord._id });
```

---

## Files Modified Summary

| File | Type | Changes |
|------|------|---------|
| Frontend/src/App.tsx | Modified | Added import + route |
| Frontend/src/components/ForgotPassword.tsx | New | Complete component |
| Backend/routes/auth.js | Modified | Added 3 endpoints |
| Backend/models/otp.js | Modified | Updated enum |

**Total Lines Added**:
- Frontend Component: ~450 lines
- Backend Routes: ~280 lines
- Model Update: 1 line
- App.tsx Update: 2 lines
- **Total: ~733 lines**

---

## Testing Scenarios

### Happy Path
```
User Email → OTP Sent → OTP Verified → Password Reset → Login
```

### Error Paths
```
Invalid Email → Error Message
Wrong OTP → Resend Option
Expired OTP → Request New OTP
Password Mismatch → Try Again
Short Password → Try Again with longer password
```

---

## Notes

1. **OTP is sent to registered email** - Requires email service to be configured
2. **OTP is 10 minutes valid** - Can be extended in code if needed
3. **Passwords are hashed** - Plain text not stored in database
4. **User is not auto-logged in** - Must login with new password
5. **OTP is single-use** - Cannot reuse same OTP for multiple resets
6. **Progress bar shows 3 steps** - Visual feedback for user

---

## How to Test Each Endpoint

### Test Send OTP
```bash
curl -X POST http://localhost:5000/auth/send-reset-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Verify OTP
```bash
curl -X POST http://localhost:5000/auth/verify-reset-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Test Reset Password
```bash
curl -X POST http://localhost:5000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"newPass123","confirmPassword":"newPass123"}'
```

---

**Implementation Complete!** ✅

All files are created, integrated, and ready to use.
