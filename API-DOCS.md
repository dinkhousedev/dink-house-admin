# Allowed Emails API Documentation

## Overview
The Allowed Emails API manages the list of pre-approved email addresses that are permitted to sign up for the admin panel. Only users with admin or manager roles can access these endpoints.

## Base URL
```
/api/admin/allowed-emails
```

## Authentication
All endpoints require authentication via session cookie. The user must have either `admin` or `manager` role (except DELETE which requires `admin` only).

## Endpoints

### 1. GET /api/admin/allowed-emails
**Description:** Retrieve all allowed email addresses

**Authorization:** Admin or Manager

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "coach",
      "notes": "Team lead",
      "is_active": true,
      "used_at": null,
      "used_by": null,
      "added_by": "admin@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 Unauthorized` - No session found
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 2. POST /api/admin/allowed-emails
**Description:** Add a new email to the allowed list

**Authorization:** Admin or Manager

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "coach",
  "notes": "New team member"
}
```

**Parameters:**
- `email` (required) - Email address to allow
- `firstName` (optional) - User's first name
- `lastName` (optional) - User's last name
- `role` (optional) - User role: `admin`, `manager`, `coach`, or `viewer` (default: `viewer`)
- `notes` (optional) - Additional notes about the user

**Success Response:**
```json
{
  "success": true,
  "message": "Email added to allowed list successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "coach",
    "notes": "New team member",
    "is_active": true,
    "added_by": "admin@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (missing email, invalid format, or invalid role)
- `401 Unauthorized` - No session found
- `403 Forbidden` - Insufficient permissions
- `409 Conflict` - Email already exists in allowed list
- `500 Internal Server Error` - Server error

---

### 3. DELETE /api/admin/allowed-emails
**Description:** Remove or deactivate an email from the allowed list

**Authorization:** Admin only

**Query Parameters:**
- `email` (required) - Email address to remove

**Example:**
```
DELETE /api/admin/allowed-emails?email=user@example.com
```

**Success Response:**
```json
{
  "success": true,
  "message": "Email removed from allowed list"
}
```

**Notes:**
- If the email has already been used for signup (`used_at` is not null), it will be deactivated instead of deleted
- Deactivated emails can be reactivated by using the POST endpoint with the same email

**Error Responses:**
- `400 Bad Request` - Missing email parameter
- `401 Unauthorized` - No session found
- `403 Forbidden` - Admin access required
- `404 Not Found` - Email not found in allowed list
- `500 Internal Server Error` - Server error

---

## Usage Examples

### JavaScript/Fetch
```javascript
// Get all allowed emails
const response = await fetch('/api/admin/allowed-emails', {
  method: 'GET',
  credentials: 'include' // Include cookies
});
const data = await response.json();

// Add new allowed email
const response = await fetch('/api/admin/allowed-emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'newuser@dinkhouse.com',
    firstName: 'New',
    lastName: 'User',
    role: 'coach',
    notes: 'Joined in January 2024'
  })
});
const data = await response.json();

// Delete allowed email
const response = await fetch('/api/admin/allowed-emails?email=user@dinkhouse.com', {
  method: 'DELETE',
  credentials: 'include'
});
const data = await response.json();
```

### cURL
```bash
# Get all allowed emails
curl -X GET http://localhost:3000/api/admin/allowed-emails \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Add new allowed email
curl -X POST http://localhost:3000/api/admin/allowed-emails \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "newuser@dinkhouse.com",
    "firstName": "New",
    "lastName": "User",
    "role": "coach"
  }'

# Delete allowed email
curl -X DELETE "http://localhost:3000/api/admin/allowed-emails?email=user@dinkhouse.com" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

## Database Schema
The API interacts with the `app_auth.allowed_emails` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | CITEXT | Email address (case-insensitive) |
| first_name | VARCHAR(100) | User's first name |
| last_name | VARCHAR(100) | User's last name |
| role | VARCHAR(50) | User role |
| added_by | UUID | Reference to user who added this email |
| notes | TEXT | Additional notes |
| is_active | BOOLEAN | Whether email is active |
| used_at | TIMESTAMP | When email was used for signup |
| used_by | UUID | User ID created with this email |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Security Considerations
1. All endpoints require authentication
2. Role-based access control (RBAC) is enforced
3. Email addresses are stored in lowercase
4. Used emails cannot be fully deleted, only deactivated
5. All actions should be logged for audit purposes