# Managing Allowed Emails

This guide explains how to manage the list of email addresses that are authorized to sign up for the Dink House admin system.

## Overview

The sign-up system uses a database table (`auth.allowed_emails`) to control which email addresses can create accounts. Only pre-authorized emails can sign up.

## Methods to Add/Manage Emails

### 1. Using the Admin Interface (Recommended)

Navigate to the admin panel at `/admin/allowed-emails` in your application.

From here you can:
- View all allowed emails
- Add new email addresses
- Toggle active/inactive status
- Delete unused emails
- See which emails have already been used

### 2. Direct Database Access via Docker

If you need to manage emails directly in the database:

```bash
# Connect to the database
docker exec -it dink-house-db psql -U postgres -d dink_house

# View all allowed emails
SELECT * FROM auth.allowed_emails;

# Add a new allowed email
INSERT INTO auth.allowed_emails (email, first_name, last_name, role, notes)
VALUES ('new.person@dinkhouse.com', 'New', 'Person', 'coach', 'Added manually');

# Update an email's status
UPDATE auth.allowed_emails
SET is_active = true
WHERE email = 'new.person@dinkhouse.com';

# Delete an email (only if not used)
DELETE FROM auth.allowed_emails
WHERE email = 'old.person@dinkhouse.com'
AND used_at IS NULL;

# Exit psql
\q
```

### 3. Using SQL Files

Add emails to the seed file at `/home/timc/dink-house-db/sql/seeds/allowed_emails.sql`:

```sql
INSERT INTO auth.allowed_emails (email, first_name, last_name, role, notes)
VALUES
    ('new.employee@dinkhouse.com', 'First', 'Last', 'role', 'Description')
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;
```

Then run:
```bash
cat /home/timc/dink-house-db/sql/seeds/allowed_emails.sql | docker exec -i dink-house-db psql -U postgres -d dink_house
```

### 4. Using Supabase Studio

If you have Supabase Studio running (http://localhost:9000):
1. Navigate to the Table Editor
2. Select the `auth.allowed_emails` table
3. Add, edit, or delete rows directly

## Available Roles

- `manager` - Full administrative access
- `admin` - Administrative functions
- `coach` - Coach-specific features
- `viewer` - Read-only access

## Important Fields

- **email**: The email address allowed to sign up (required)
- **first_name/last_name**: Pre-fill the sign-up form
- **role**: Default role assigned on sign-up
- **is_active**: Whether this email can currently sign up
- **used_at**: Timestamp when the email was used (null if unused)
- **notes**: Any additional information

## Security Notes

- Each email can only be used once for sign-up
- After sign-up, the `used_at` field is populated
- Inactive emails cannot sign up even if in the table
- The admin interface requires authentication and appropriate permissions

## Troubleshooting

### Email not working for sign-up

Check that:
1. Email exists in `auth.allowed_emails` table
2. `is_active` is set to `true`
3. `used_at` is `NULL` (hasn't been used yet)
4. Email is entered exactly as stored (case-insensitive)

### Can't access admin interface

Ensure your user account has admin or manager role to access `/admin/allowed-emails`.

### Database connection issues

Verify:
- Docker container `dink-house-db` is running
- Database is accessible on port 9432
- Environment variables in `.env.local` are correct