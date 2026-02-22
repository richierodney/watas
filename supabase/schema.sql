-- WATAs Database Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table (stores enabled/disabled state)
CREATE TABLE IF NOT EXISTS groups (
  id VARCHAR(20) PRIMARY KEY CHECK (id IN ('Group 1', 'Group 2')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default groups
INSERT INTO groups (id, enabled) VALUES ('Group 1', true), ('Group 2', true)
ON CONFLICT (id) DO NOTHING;

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  course_name VARCHAR(200) NOT NULL,
  groups TEXT[] NOT NULL CHECK (array_length(groups, 1) > 0),
  due_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_course_code ON assignments(course_code);
CREATE INDEX IF NOT EXISTS idx_assignments_groups ON assignments USING GIN(groups);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default course if none exists
INSERT INTO courses (code, name) VALUES ('CSM 157', 'Intro to AI')
ON CONFLICT (code) DO NOTHING;

-- Insert default assignments (optional - remove if you want to start fresh)
INSERT INTO assignments (title, course_code, course_name, groups, due_date, description)
VALUES
  ('Search & Heuristics Worksheet', 'CSM 157', 'Intro to AI', ARRAY['Group 1'], '2026-02-15', 'Practice problems on uninformed and informed search.'),
  ('Mini Project: Tic-Tac-Toe Agent', 'CSM 157', 'Intro to AI', ARRAY['Group 2'], '2026-02-18', 'Implement an agent with minimax and basic evaluation.'),
  ('Probability Refresher Quiz', 'CSM 157', 'Intro to AI', ARRAY['Group 1', 'Group 2'], '2026-02-20', 'Short quiz on random variables, independence, and Bayes rule.')
ON CONFLICT DO NOTHING;

-- Page visits/analytics table
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path VARCHAR(200) NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_path ON page_visits(page_path);

-- Support / Suggestions table
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_type VARCHAR(50) NOT NULL, -- e.g. \"Missing Assignment\", \"Feature Request\", \"Bug\", \"Other\"
  contact_whatsapp VARCHAR(100),
  contact_phone VARCHAR(100),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at);

