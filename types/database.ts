// Player types
export interface Player {
  id: string;
  account_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  skill_level?: string;
  membership_level?: string;
  membership_start_date?: string;
  membership_end_date?: string;
  dupr_id?: string;
  dupr_rating?: number;
  created_at?: string;
  updated_at?: string;
}

export type EmployeeRole =
  | "admin"
  | "coach"
  | "maintenance"
  | "pro_shop"
  | "manager";
export type EmployeeStatus = "pending" | "active" | "inactive" | "terminated";
export type EmployeeType =
  | "full_time"
  | "part_time"
  | "contractor"
  | "seasonal";
export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household";
export type PayType = "hourly" | "salary";
export type PayFrequency = "weekly" | "biweekly" | "monthly";
export type AccountType = "checking" | "savings";
export type DocumentType = "w4" | "i9" | "certification" | "id" | "other";

export interface Employee {
  id: string;
  auth_id: string;
  email: string;

  // Personal Information
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  phone?: string;

  // Employment Information
  employee_id?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  employment_type: EmployeeType;
  department?: string;
  position_title?: string;
  hire_date?: string;
  termination_date?: string;

  created_at: string;
  updated_at: string;
}

export interface EmployeeProfile {
  id: string;
  employee_id: string;

  // Address Information
  street_address?: string;
  apartment_unit?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Additional Information
  shirt_size?: string;
  certifications?: string[];
  specialties?: string[];
  availability?: any;
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface W2Information {
  id: string;
  employee_id: string;

  // Tax Information
  ssn_encrypted?: string;

  // W-4 Information
  filing_status?: FilingStatus;
  allowances?: number;
  additional_withholding?: number;
  exempt_from_withholding?: boolean;

  // State Tax Information
  state_filing_status?: string;
  state_allowances?: number;
  state_additional_withholding?: number;

  // I-9 Verification
  i9_verified?: boolean;
  i9_verification_date?: string;
  work_authorization_type?: string;
  work_authorization_expiry?: string;

  created_at: string;
  updated_at: string;
}

export interface PayrollInformation {
  id: string;
  employee_id: string;

  // Compensation
  pay_type: PayType;
  pay_rate?: number;
  pay_frequency?: PayFrequency;

  // Direct Deposit
  bank_name?: string;
  account_type?: AccountType;
  routing_number_encrypted?: string;
  account_number_encrypted?: string;

  // Benefits
  health_insurance_enrolled?: boolean;
  dental_insurance_enrolled?: boolean;
  vision_insurance_enrolled?: boolean;
  retirement_401k_percentage?: number;

  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: DocumentType;
  document_name: string;
  file_path?: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_at: string;
  verified?: boolean;
  verified_by?: string;
  verified_at?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  employee_id: string;
  action: "view" | "create" | "update" | "delete";
  table_name?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Form types for signup process
export interface SignupFormData {
  // Step 1: Account Creation
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;

  // Step 3: Address Information
  streetAddress: string;
  apartmentUnit?: string;
  city: string;
  state: string;
  zipCode: string;

  // Step 4: Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;

  // Step 5: Employment Information
  role: EmployeeRole;
  employmentType: EmployeeType;
  department: string;
  positionTitle: string;
  hireDate: string;

  // Step 6: Tax Information (W-2)
  ssn: string;
  filingStatus: FilingStatus;
  allowances: number;
  additionalWithholding?: number;

  // Step 7: Direct Deposit
  bankName?: string;
  accountType?: AccountType;
  routingNumber?: string;
  accountNumber?: string;

  // Step 8: Consent
  consentToTerms: boolean;
  consentToBackgroundCheck: boolean;
}

export interface EmployeeWithProfile extends Employee {
  profile?: EmployeeProfile;
  w2_information?: W2Information;
  payroll_information?: PayrollInformation;
  documents?: EmployeeDocument[];
}
