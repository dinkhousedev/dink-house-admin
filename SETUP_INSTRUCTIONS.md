# Dink House Employee Management System - Setup Instructions

## Overview
This system provides comprehensive employee management with authentication, W-2 information capture, and multi-step onboarding for Dink House employees.

## Setup Steps

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials from Settings > API
3. Update `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

1. In Supabase SQL Editor, execute the schema file:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and run the contents of `/supabase/schema.sql`
   - This creates all necessary tables with proper security policies

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

Access the application at `http://localhost:3000`

## Features Implemented

### Authentication System
- **Login Page** (`/auth/login`): Employee sign-in with email/password
- **Signup Flow** (`/auth/signup`): 8-step onboarding process
- **Protected Routes**: Automatic redirection for unauthorized access
- **Session Management**: JWT-based authentication with Supabase

### Employee Profiles
Different employee types supported:
- **Coach**: Teaching certifications, specialties
- **Admin Staff**: Department access permissions
- **Maintenance Staff**: Skills and shift preferences
- **Pro Shop Staff**: Sales and inventory permissions

### W-2 Information Collection
Comprehensive data capture for tax compliance:
- Personal information (SSN encrypted)
- Tax withholding preferences (W-4)
- Direct deposit information
- I-9 verification tracking
- State tax information

### Multi-Step Signup Process
1. **Account Creation**: Email and password setup
2. **Personal Information**: Name, DOB, phone
3. **Address**: Complete residential address
4. **Emergency Contact**: Emergency contact details
5. **Employment Info**: Role, department, start date
6. **Tax Information**: W-4 details and SSN
7. **Direct Deposit**: Bank account setup (optional)
8. **Review & Consent**: Terms acceptance

### Employee Dashboard
- Profile completion tracking
- Document upload status
- Quick access to pay stubs and schedule
- Employment details display
- Contact information management

## Security Features

### Data Protection
- **Encryption**: SSN and bank details encrypted using pgcrypto
- **Row Level Security**: Database-level access control
- **Audit Logging**: Track all sensitive data access
- **HTTPS Enforcement**: Secure data transmission
- **Input Validation**: Prevent SQL injection and XSS

### Role-Based Access Control
- Employees can view/edit their own data
- Admins have full access to employee management
- Managers can view team member information
- Sensitive data (W-2, payroll) restricted to authorized roles

## Database Schema

### Core Tables
- `employees`: Basic employee information
- `employee_profiles`: Additional profile data
- `w2_information`: Tax and W-2 data (encrypted)
- `payroll_information`: Compensation and benefits
- `employee_documents`: Document uploads tracking
- `audit_log`: Security audit trail

### Employee Roles
- `admin`: Full system access
- `coach`: Coaching staff
- `maintenance`: Facility maintenance
- `pro_shop`: Retail operations
- `manager`: Team management

### Employee Status
- `pending`: Awaiting approval
- `active`: Active employee
- `inactive`: Temporarily inactive
- `terminated`: No longer employed

## User Flow

### New Employee Onboarding
1. Employee receives invitation to create account
2. Completes 8-step signup process
3. Account marked as "pending" status
4. Manager reviews and approves account
5. Employee receives notification of approval
6. Can access dashboard and complete profile

### Existing Employee Login
1. Sign in at `/auth/login`
2. Redirected to employee dashboard
3. View profile completion status
4. Access pay stubs, schedule, documents
5. Update personal information as needed

## API Endpoints (To Be Implemented)

- `POST /api/auth/signup`: Create new employee account
- `GET /api/employee/profile`: Get employee profile
- `PUT /api/employee/profile`: Update employee profile
- `POST /api/employee/documents`: Upload documents
- `GET /api/employee/w2-data`: Get W-2 information
- `PUT /api/employee/w2-data`: Update W-2 information

## Testing

### Test Accounts
Create test accounts with different roles to verify:
- Authentication flow
- Role-based permissions
- Profile completion
- Document upload
- Dashboard access

### Security Testing
- Verify encryption of sensitive data
- Test row-level security policies
- Check audit log functionality
- Validate input sanitization

## Deployment Considerations

1. **Environment Variables**: Set production Supabase credentials
2. **SSL Certificate**: Ensure HTTPS is configured
3. **Backup Strategy**: Regular database backups
4. **Monitoring**: Set up error tracking and logging
5. **Compliance**: Verify W-2 data handling meets regulations

## Maintenance

### Regular Tasks
- Review audit logs for security
- Update employee statuses
- Process document verifications
- Generate payroll reports
- Archive terminated employee data

### Database Maintenance
- Regular backups
- Index optimization
- Security policy reviews
- Encryption key rotation

## Support

For issues or questions:
- Check Supabase dashboard for database issues
- Review browser console for client-side errors
- Check server logs for API errors
- Contact system administrator for access issues