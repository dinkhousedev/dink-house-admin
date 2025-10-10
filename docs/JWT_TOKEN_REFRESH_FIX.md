# JWT Token Refresh Fix

## Problem Summary

Admin users were being logged out after ~1 hour due to JWT token expiration. The session cookies persisted for 24 hours, but the JWT tokens inside expired after 1 hour (Supabase default), causing "invalid JWT: token is expired" errors.

## Root Causes

1. **Cookie maxAge Mismatch**: Session token cookies were set to 24 hours, but Supabase JWTs expire in 1 hour
2. **No Server-Side Token Refresh**: The app stored refresh_token but never used it server-side
3. **No Middleware Refresh Logic**: Expired tokens weren't refreshed before processing protected routes
4. **Next.js 15 Async Params**: Dynamic route params weren't being awaited (separate issue)

## Solutions Implemented

### 1. Token Refresh API Endpoint
**File**: `app/api/auth/refresh/route.ts` (NEW)

Created a dedicated POST endpoint that:
- Accepts refresh_token from cookies
- Calls Supabase `refreshSession()` API
- Updates both session_token and refresh_token cookies
- Returns success/failure status

### 2. Auto-Refresh in User Auth Endpoint
**File**: `app/api/auth/user/route.ts` (MODIFIED)

Enhanced the GET endpoint to:
- Detect JWT expiration errors
- Automatically refresh tokens using refresh_token cookie
- Update cookies with new tokens
- Retry user verification with refreshed token
- Only return 401 if refresh fails

**Key Changes**:
- Added `refreshToken` cookie retrieval
- Changed `authUser` and `authError` to `let` for reassignment
- Added expiration detection: `authError.message?.includes("expired")`
- Created Supabase anon client for refresh operation
- Updated cookies with new tokens on successful refresh
- Retry getUser() with new access token

### 3. Proactive Token Refresh in Middleware
**File**: `middleware.ts` (MODIFIED)

Added proactive token verification and refresh:
- Before processing protected routes, verify current token
- If token is expired, attempt refresh using refresh_token
- Update response cookies with new tokens
- Redirect to login only if refresh fails

**Key Changes**:
- Imported `createClient` from `@supabase/supabase-js`
- Changed `isAuthenticated` to `let` for reassignment
- Added token verification for authenticated users
- Refresh tokens on expiration detection
- Return response with updated cookies

### 4. Fixed Cookie maxAge Settings
**File**: `app/auth/callback/route.ts` (MODIFIED)

Corrected cookie expiration times:
- `session_token`: Changed from 24 hours to **1 hour** (matches JWT expiry)
- `user_role`: Changed from 24 hours to **1 hour** (matches session token)
- `refresh_token`: Kept at **7 days**

### 5. Fixed Next.js 15 Async Params
**File**: `app/api/admin/members/[id]/route.ts` (MODIFIED)

Updated dynamic route params for Next.js 15:
- Changed `params: { id: string }` to `params: Promise<{ id: string }>`
- Changed `params.id` to `(await params).id`

### 6. Created Shared Helper Functions
**File**: `lib/auth/refresh-tokens.ts` (NEW)

Created reusable utilities:
- `refreshAuthTokens(refreshToken)`: Refresh tokens with error handling
- `SESSION_COOKIE_OPTIONS`: Standardized session cookie config (1 hour)
- `REFRESH_COOKIE_OPTIONS`: Standardized refresh cookie config (7 days)

## Token Flow

### Before Fix
1. User logs in → JWT (1h expiry) stored in cookie (24h maxAge)
2. After 1 hour → JWT expires but cookie still exists
3. API routes verify expired JWT → **401 Unauthorized**
4. User forced to re-login

### After Fix
1. User logs in → JWT (1h expiry) stored in cookie (1h maxAge)
2. After 1 hour → JWT expires, cookie may still exist
3. Middleware/API routes detect expiration → **Auto-refresh using refresh_token**
4. New JWT issued → Cookies updated → Request continues
5. After 7 days → Refresh token expires → User must re-login

## Testing Checklist

- [ ] Login and verify admin dashboard access
- [ ] Wait 1+ hour (or manually expire JWT) and verify auto-refresh works
- [ ] Delete member from admin panel (test async params fix)
- [ ] Navigate between pages after token expiry (test middleware refresh)
- [ ] Check browser DevTools → No "invalid JWT" errors
- [ ] Verify session persists beyond 1 hour
- [ ] Verify logout after 7 days (refresh token expiry)

## Configuration Requirements

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `NODE_ENV` (for secure cookie flag)

## Files Modified

1. `app/api/auth/refresh/route.ts` - NEW
2. `app/api/auth/user/route.ts` - MODIFIED
3. `middleware.ts` - MODIFIED
4. `app/auth/callback/route.ts` - MODIFIED
5. `app/api/admin/members/[id]/route.ts` - MODIFIED
6. `lib/auth/refresh-tokens.ts` - NEW

## Additional Notes

- The refresh logic is defensive: if refresh fails, users are redirected to login
- Refresh tokens are rotated on each refresh for security
- Cookie options use `httpOnly: true` to prevent XSS attacks
- `sameSite: 'lax'` balances security with usability
- Secure flag enabled in production only

## Future Enhancements

1. Add token expiry time tracking to reduce unnecessary verification calls
2. Implement client-side token refresh listener
3. Add metrics/logging for token refresh success rates
4. Consider shorter refresh token expiry for higher security environments
