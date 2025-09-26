# API Examples - Adding Allowed Emails with curl

## Quick Add Tim Carrender's Email

### Simple curl command:
```bash
curl -X POST http://localhost:3000/api/allowed-emails \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tim.carrender@gmail.com",
    "first_name": "Tim",
    "last_name": "Carrender",
    "role": "admin"
  }'
```

### One-liner version:
```bash
curl -X POST http://localhost:3000/api/allowed-emails -H "Content-Type: application/json" -d '{"email":"tim.carrender@gmail.com","first_name":"Tim","last_name":"Carrender","role":"admin"}'
```

### Using the provided script:
```bash
# Default adds Tim Carrender as admin
./scripts/add-email.sh

# Or specify custom details
./scripts/add-email.sh "email@example.com" "First" "Last" "coach"
```

## API Endpoints

### POST /api/allowed-emails - Add new email
```bash
curl -X POST http://localhost:3000/api/allowed-emails \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "coach",
    "notes": "Optional note"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email user@example.com has been added to the allowed list",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "coach",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### GET /api/allowed-emails - List all allowed emails
```bash
curl http://localhost:3000/api/allowed-emails
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "emails": [
    {
      "email": "john.doe@dinkhouse.com",
      "role": "manager",
      "name": "John Doe",
      "is_used": false
    }
  ]
}
```

### GET /api/allowed-emails?email=xxx - Check specific email
```bash
curl "http://localhost:3000/api/allowed-emails?email=tim.carrender@gmail.com"
```

**Response:**
```json
{
  "success": true,
  "allowed": true,
  "email": "tim.carrender@gmail.com",
  "role": "admin",
  "is_used": false
}
```

## Available Roles
- `manager` - Full system access
- `admin` - Administrative access
- `coach` - Coach-specific features
- `viewer` - Read-only access

## Error Responses

### Email already exists:
```json
{
  "success": false,
  "error": "This email is already in the allowed list"
}
```
Status: 409 Conflict

### Missing email:
```json
{
  "error": "Email is required"
}
```
Status: 400 Bad Request

## Testing with curl

### Add multiple emails quickly:
```bash
# Add Tim
curl -X POST http://localhost:3000/api/allowed-emails -H "Content-Type: application/json" -d '{"email":"tim.carrender@gmail.com","first_name":"Tim","last_name":"Carrender","role":"admin"}'

# Add another user
curl -X POST http://localhost:3000/api/allowed-emails -H "Content-Type: application/json" -d '{"email":"sarah.jones@dinkhouse.com","first_name":"Sarah","last_name":"Jones","role":"coach"}'

# Check if Tim's email is allowed
curl "http://localhost:3000/api/allowed-emails?email=tim.carrender@gmail.com"

# List all allowed emails
curl http://localhost:3000/api/allowed-emails
```

## Direct Database Alternative

If the API isn't running, you can still add emails directly:
```bash
docker exec dink-house-db psql -U postgres -d dink_house -c "INSERT INTO public.allowed_emails (email, first_name, last_name, role) VALUES ('tim.carrender@gmail.com', 'Tim', 'Carrender', 'admin');"
```