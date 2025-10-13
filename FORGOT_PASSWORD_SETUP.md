# Forgot Password Feature - Complete Setup

## Overview
Complete forgot/reset password functionality has been integrated into TripFlow with a seamless user experience.

## User Flow

### 1. Forgot Password Request
**Location:** `/forgot-password`

1. User clicks "Forgot password?" link in login modal
2. Enters email address
3. Submits form
4. Backend:
   - Validates email exists
   - Generates secure reset token
   - Saves token to profile with 1-hour expiry
   - Sends email with reset link
5. Success confirmation displayed
6. User receives email with reset link

### 2. Reset Password
**Location:** `/reset-password/[token]`

1. User clicks link from email
2. Token extracted from URL automatically
3. User enters new password and confirmation
4. Password requirements validated:
   - Minimum 6 characters
   - Passwords must match
5. Submits to backend
6. Backend validates token and updates password
7. Success message displayed
8. Auto-redirects to login after 3 seconds

## Files Modified/Created

### 1. AuthModal Component
**File:** `src/components/AuthModal.tsx`

**Changes:**
- Added "Forgot password?" link next to password field (login mode only)
- Link closes modal and navigates to `/forgot-password`
- Styled with TripFlow theme colors (blue gradient)

```tsx
{current === "login" && (
  <a
    href="/forgot-password"
    className="text-xs text-[#60a5fa] hover:text-[#22d3ee] hover:underline transition-colors"
    onClick={(e) => {
      e.preventDefault();
      onClose();
      window.location.href = "/forgot-password";
    }}
  >
    Forgot password?
  </a>
)}
```

### 2. Forgot Password Page
**File:** `src/app/forgot-password/page.tsx`

**Features:**
- Email input form with validation
- Loading state during submission
- Error display for failed requests
- Success state with confirmation message
- Links back to login page
- Full i18n support with translations
- CORS configuration for API calls

**API Endpoint:** `POST /user/forgot-password`
**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Reset email sent",
  "token": "..." // for dev purposes
}
```

### 3. Reset Password Page
**File:** `src/app/reset-password/[token]/page.tsx`

**Features:**
- Dynamic route with token parameter
- New password + confirmation fields
- Show/hide password toggle
- Real-time password requirement validation
- Success state with auto-redirect
- Error handling for expired/invalid tokens
- Links back to login page
- CORS configuration for API calls

**API Endpoint:** `POST /user/reset-password/:token`
**Request Body:**
```json
{
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

## Backend Requirements

### Environment Variables
Ensure these are set in your backend `.env`:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=yassinemz569@gmail.com
MAIL_PASSWORD=your_app_password_here
MAIL_FROM=yassinemz569@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001

# CORS
CORS_ORIGINS=http://localhost:3001
```

### Email Template
The reset email should contain a link like:
```
http://localhost:3001/reset-password/{token}
```

**Current backend sends:**
```
http://localhost:3000/user/reset-password/{token}
```

⚠️ **ACTION REQUIRED:** Update backend email template to use `FRONTEND_URL` instead of backend URL.

### Backend Services Required

1. **PasswordService** (already implemented)
   - `forgotPassword(email)` - generates token and sends email
   - `resetPasswordWithToken(token, newPassword)` - validates and updates

2. **UserController** (already implemented)
   - `POST /user/forgot-password` - handles forgot password requests
   - `POST /user/reset-password/:token` - handles password reset

3. **UserService** (already implemented)
   - User lookup and profile updates

## Testing Checklist

### Frontend Testing
- [ ] "Forgot password?" link appears in login modal
- [ ] Link closes modal and navigates to `/forgot-password`
- [ ] Forgot password form validates email format
- [ ] Success message appears after submission
- [ ] Email reset link navigates to `/reset-password/[token]`
- [ ] Token is properly extracted from URL
- [ ] Password requirements are displayed
- [ ] Form validates passwords match
- [ ] Success state shows and auto-redirects
- [ ] "Back to Login" links work on both pages

### Backend Testing
- [ ] Forgot password endpoint receives requests
- [ ] Email is sent with correct reset link format
- [ ] Token is saved to profile with expiry
- [ ] Reset password endpoint validates token
- [ ] Expired tokens are rejected
- [ ] Password is updated in database
- [ ] User can login with new password

### Integration Testing
- [ ] Complete flow from login modal to password reset
- [ ] Email arrives within seconds
- [ ] Link works and loads reset page
- [ ] Password successfully resets
- [ ] Login with new password works

## Security Features

✅ **Token Expiry:** 1 hour (configured in backend)
✅ **One-time Use:** Token should be invalidated after use
✅ **CORS Protection:** API calls include CORS configuration
✅ **HTTPS Ready:** Works with production HTTPS
✅ **Password Requirements:** Minimum 6 characters enforced
✅ **Email Validation:** Valid email format required

## Styling

All pages use TripFlow's design system:
- CSS custom properties for theming
- Consistent border radius (rounded-xl, rounded-2xl)
- Blue gradient colors (#60a5fa, #22d3ee)
- Backdrop blur effects
- Smooth transitions and hover states
- Mobile-responsive design

## Known Issues / TODO

1. **Email Link Format:** Backend needs to send frontend URL, not backend URL
   - Current: `http://localhost:3000/user/reset-password/{token}`
   - Required: `http://localhost:3001/reset-password/{token}`

2. **Token Invalidation:** Verify token is invalidated after successful reset

3. **Rate Limiting:** Consider adding rate limiting to prevent abuse

4. **Email Delivery:** Ensure Gmail app password is correctly configured

## Quick Start

1. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Frontend:**
   ```bash
   cd tripflow_next
   npm run dev
   ```

3. **Test Flow:**
   - Open http://localhost:3001
   - Click "Sign in" button
   - Click "Forgot password?" link
   - Enter email: your_test@email.com
   - Check email inbox
   - Click reset link
   - Set new password
   - Login with new password

## API Documentation

### POST /user/forgot-password
Initiates password reset process.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Reset email sent",
  "token": "abc123..." // only in development
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

### POST /user/reset-password/:token
Resets password with token.

**Parameters:**
- `token` (URL param) - Reset token from email

**Request:**
```json
{
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Error Responses:**
- **400:** Passwords don't match
- **400:** Token expired
- **404:** Invalid token

## Deployment Notes

### Production Environment Variables
Update these for production:

```env
# Backend
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=production-email@gmail.com
MAIL_PASSWORD=production_app_password
```

```env
# Frontend
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Email Template Production
Ensure email contains production URL:
```
https://yourdomain.com/reset-password/{token}
```

---

**Status:** ✅ Frontend Complete | ⚠️ Backend Email URL Needs Update

**Last Updated:** October 13, 2025
