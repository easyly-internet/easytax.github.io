-- PostgreSQL Database Schema for Tax Sahi Hai

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'admin', 'ca', 'member'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'active', 'pending', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for login
CREATE INDEX idx_users_email ON users(email);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pan_number VARCHAR(10) UNIQUE,
    aadhar_number VARCHAR(12),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CA Profiles Table
CREATE TABLE ca_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practice_name VARCHAR(255),
    membership_number VARCHAR(50) NOT NULL UNIQUE,
    years_of_experience INTEGER,
    specializations TEXT[],
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Years Table
CREATE TABLE financial_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_name VARCHAR(10) NOT NULL UNIQUE, -- '2023-2024'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default financial years
INSERT INTO financial_years (year_name, start_date, end_date)
VALUES
('2022-2023', '2022-04-01', '2023-03-31'),
('2023-2024', '2023-04-01', '2024-03-31'),
('2024-2025', '2024-04-01', '2025-03-31');

-- Member Year Assessments
CREATE TABLE member_year_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    financial_year_id UUID NOT NULL REFERENCES financial_years(id),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    ca_id UUID REFERENCES users(id), -- CA assigned to this assessment
    tax_refund NUMERIC(12, 2),
    fees NUMERIC(12, 2),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, financial_year_id)
);

-- Document Types
CREATE TABLE document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE
);

-- Insert default document types
INSERT INTO document_types (name, description, is_required)
VALUES
('Form 16', 'Salary income tax certificate', TRUE),
('Form 16A', 'TDS certificate for non-salary income', FALSE),
('Bank Statement', 'Bank account statement showing interest income', FALSE),
('Investment Proof', 'Proof of investments for tax deduction', FALSE),
('Rent Receipt', 'Rent receipts for HRA exemption', FALSE),
('Property Tax Receipt', 'Property tax payment receipt', FALSE),
('Home Loan Statement', 'Housing loan interest certificate', FALSE),
('Medical Bills', 'Medical expense receipts for deduction', FALSE),
('PAN Card', 'Permanent Account Number card', TRUE),
('Aadhaar Card', 'Unique Identity card', TRUE);

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES member_year_assessments(id) ON DELETE CASCADE,
    document_type_id INTEGER NOT NULL REFERENCES document_types(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    remarks TEXT
);

-- Create index on assessment_id
CREATE INDEX idx_documents_assessment_id ON documents(assessment_id);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    monthly_price NUMERIC(10, 2) NOT NULL,
    annual_price NUMERIC(10, 2) NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, monthly_price, annual_price, features)
VALUES
('Basic', 'Basic tax filing assistance', 299, 2990, '{"ai_assistance": true, "document_storage": "1GB", "ca_consultation": false, "premium_support": false}'),
('Pro', 'Professional tax planning with CA support', 599, 5990, '{"ai_assistance": true, "document_storage": "5GB", "ca_consultation": true, "premium_support": false}'),
('Enterprise', 'Complete tax management with priority support', 999, 9990, '{"ai_assistance": true, "document_storage": "20GB", "ca_consultation": true, "premium_support": true}');

-- Member Subscriptions
CREATE TABLE member_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_id VARCHAR(255),
    amount_paid NUMERIC(10, 2) NOT NULL,
    discount_applied NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on member_id
CREATE INDEX idx_member_subscriptions_member_id ON member_subscriptions(member_id);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES member_subscriptions(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'debit_card', 'upi', 'net_banking'
    payment_gateway VARCHAR(50) NOT NULL, -- 'stripe', 'razorpay', etc.
    transaction_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create index on member_id
CREATE INDEX idx_payments_member_id ON payments(member_id);

-- CA Assignment Table
CREATE TABLE ca_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
    UNIQUE(ca_id, member_id)
);

-- Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'document', 'payment', etc.
    entity_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Create index on user_id and timestamp
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- AI Analysis Results
CREATE TABLE ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on document_id
CREATE INDEX idx_ai_analysis_results_document_id ON ai_analysis_results(document_id);

-- AI Chat History
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    feedback SMALLINT -- User rating from 1-5
);

-- Create index on member_id
CREATE INDEX idx_ai_chat_history_member_id ON ai_chat_history(member_id);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'system', 'document', 'payment', 'reminder'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Function to update timestamp on update
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for each table with updated_at column
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_profiles_modtime
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_ca_profiles_modtime
    BEFORE UPDATE ON ca_profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_member_year_assessments_modtime
    BEFORE UPDATE ON member_year_assessments
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_subscription_plans_modtime
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_member_subscriptions_modtime
    BEFORE UPDATE ON member_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();