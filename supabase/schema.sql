-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Employee roles enum
CREATE TYPE employee_role AS ENUM (
  'admin',
  'coach',
  'maintenance',
  'pro_shop',
  'manager'
);

-- Employee status enum
CREATE TYPE employee_status AS ENUM (
  'pending',
  'active',
  'inactive',
  'terminated'
);

-- Employee type enum
CREATE TYPE employee_type AS ENUM (
  'full_time',
  'part_time',
  'contractor',
  'seasonal'
);

-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone VARCHAR(20),

  -- Employment Information
  employee_id VARCHAR(50) UNIQUE,
  role employee_role NOT NULL DEFAULT 'coach',
  status employee_status NOT NULL DEFAULT 'pending',
  employment_type employee_type NOT NULL DEFAULT 'full_time',
  department VARCHAR(100),
  position_title VARCHAR(200),
  hire_date DATE,
  termination_date DATE,

  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employee_profiles table for additional information
CREATE TABLE employee_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

  -- Address Information
  street_address VARCHAR(255),
  apartment_unit VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',

  -- Emergency Contact
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(100),

  -- Additional Information
  shirt_size VARCHAR(10),
  certifications TEXT[],
  specialties TEXT[],
  availability JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create w2_information table (sensitive data)
CREATE TABLE w2_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

  -- Tax Information (encrypted)
  ssn_encrypted TEXT, -- Will be encrypted using pgcrypto

  -- W-4 Information
  filing_status VARCHAR(50), -- 'single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household'
  allowances INTEGER DEFAULT 0,
  additional_withholding DECIMAL(10, 2) DEFAULT 0,
  exempt_from_withholding BOOLEAN DEFAULT FALSE,

  -- State Tax Information
  state_filing_status VARCHAR(50),
  state_allowances INTEGER DEFAULT 0,
  state_additional_withholding DECIMAL(10, 2) DEFAULT 0,

  -- I-9 Verification
  i9_verified BOOLEAN DEFAULT FALSE,
  i9_verification_date DATE,
  work_authorization_type VARCHAR(100),
  work_authorization_expiry DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payroll_information table
CREATE TABLE payroll_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

  -- Compensation
  pay_type VARCHAR(20) NOT NULL, -- 'hourly', 'salary'
  pay_rate DECIMAL(10, 2),
  pay_frequency VARCHAR(20), -- 'weekly', 'biweekly', 'monthly'

  -- Direct Deposit (encrypted)
  bank_name VARCHAR(100),
  account_type VARCHAR(20), -- 'checking', 'savings'
  routing_number_encrypted TEXT,
  account_number_encrypted TEXT,

  -- Benefits
  health_insurance_enrolled BOOLEAN DEFAULT FALSE,
  dental_insurance_enrolled BOOLEAN DEFAULT FALSE,
  vision_insurance_enrolled BOOLEAN DEFAULT FALSE,
  retirement_401k_percentage DECIMAL(5, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table for storing employee documents
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- 'w4', 'i9', 'certification', 'id', 'other'
  document_name VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_log table for tracking sensitive data access
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'view', 'create', 'update', 'delete'
  table_name VARCHAR(50),
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_auth_id ON employees(auth_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employee_profiles_employee_id ON employee_profiles(employee_id);
CREATE INDEX idx_w2_information_employee_id ON w2_information(employee_id);
CREATE INDEX idx_payroll_information_employee_id ON payroll_information(employee_id);
CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_audit_log_employee_id ON audit_log(employee_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);

-- Create functions for encryption/decryption (using pgcrypto)
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(data, key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON employee_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_w2_information_updated_at BEFORE UPDATE ON w2_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_information_updated_at BEFORE UPDATE ON payroll_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE w2_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees can view their own data
CREATE POLICY "Employees can view own data" ON employees
  FOR SELECT USING (auth.uid() = auth_id);

-- Admins and managers can view all employees
CREATE POLICY "Admins can view all employees" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Similar policies for other tables
CREATE POLICY "Employees can view own profile" ON employee_profiles
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage profiles" ON employee_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- W2 information - only admins and the employee themselves
CREATE POLICY "Employees can view own W2 info" ON w2_information
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage W2 info" ON w2_information
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Payroll information - strict access
CREATE POLICY "Employees can view own payroll" ON payroll_information
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage payroll" ON payroll_information
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Sample data for testing (remove in production)
-- This will be inserted after a user signs up through the auth system