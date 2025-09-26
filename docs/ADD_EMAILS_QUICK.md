# Quick Guide: Adding Allowed Emails

Since Supabase protects the `auth` schema, the allowed_emails table is in the `public` schema.

## Quick Add Methods

### Option 1: Using psql (Fastest)
```bash
# Single command to add an email
docker exec dink-house-db psql -U postgres -d dink_house -c "INSERT INTO public.allowed_emails (email, first_name, last_name, role) VALUES ('new@dinkhouse.com', 'FirstName', 'LastName', 'coach');"
```

### Option 2: Interactive psql
```bash
# Connect to database
docker exec -it dink-house-db psql -U postgres -d dink_house

# Add email
INSERT INTO public.allowed_emails (email, first_name, last_name, role, notes)
VALUES ('test@dinkhouse.com', 'Test', 'User', 'admin', 'Test account');

# View all allowed emails
SELECT email, role, is_active, used_at FROM public.allowed_emails;

# Exit
\q
```

### Option 3: Admin Interface
1. Go to `http://localhost:3000/admin/allowed-emails`
2. Click "Add Email"
3. Fill in the form and submit

### Option 4: Batch Add Multiple Emails
Create a file `add_emails.sql`:
```sql
INSERT INTO public.allowed_emails (email, first_name, last_name, role) VALUES
    ('email1@dinkhouse.com', 'First1', 'Last1', 'coach'),
    ('email2@dinkhouse.com', 'First2', 'Last2', 'admin'),
    ('email3@dinkhouse.com', 'First3', 'Last3', 'manager')
ON CONFLICT (email) DO NOTHING;
```

Then run:
```bash
cat add_emails.sql | docker exec -i dink-house-db psql -U postgres -d dink_house
```

## Available Roles
- `manager` - Full access
- `admin` - Admin access
- `coach` - Coach features
- `viewer` - Read-only

## Check If Working
```bash
# See all allowed emails
docker exec dink-house-db psql -U postgres -d dink_house -c "SELECT email, role, is_active FROM public.allowed_emails WHERE is_active = true AND used_at IS NULL;"
```

## Important Notes
- Emails are case-insensitive
- Each email can only be used once
- Table is in `public` schema, not `auth`
- `is_active` must be `true` for sign-up to work
- `used_at` must be `NULL` (not yet used)