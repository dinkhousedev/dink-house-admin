-- Create allowed_emails table for managing who can sign up
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role employee_role DEFAULT 'coach',
  is_active BOOLEAN DEFAULT true,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_is_active ON allowed_emails(is_active);

-- Enable RLS
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage allowed emails
CREATE POLICY "Admins can manage allowed emails" ON allowed_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Public read for checking if email is allowed during signup
CREATE POLICY "Public can check if email is allowed" ON allowed_emails
  FOR SELECT USING (is_active = true);

-- Function to check if email is allowed
CREATE OR REPLACE FUNCTION is_email_allowed(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_emails
    WHERE email = LOWER(check_email)
    AND is_active = true
    AND used_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as used after signup
CREATE OR REPLACE FUNCTION mark_email_used(used_email TEXT, user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE allowed_emails
  SET used_at = NOW(),
      used_by = user_id
  WHERE email = LOWER(used_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial admin email (replace with your actual admin email)
INSERT INTO allowed_emails (email, first_name, last_name, role, is_active)
VALUES
  ('tim.carrender@gmail.com', 'Tim', 'Carrender', 'admin', true),
  ('admin@dinkhouse.com', 'Admin', 'User', 'admin', true),
  ('manager@dinkhouse.com', 'Manager', 'User', 'manager', true),
  ('coach@dinkhouse.com', 'Coach', 'User', 'coach', true)
ON CONFLICT (email) DO UPDATE
SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;