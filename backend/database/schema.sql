CREATE TYPE user_role AS ENUM ('supervisor', 'officer', 'agent');

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  supervisor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission_per_person NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by_supervisor BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS officers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_submissions (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  full_name VARCHAR(120) NOT NULL,
  idno VARCHAR(50) NOT NULL UNIQUE CHECK (idno ~ '^\\d{12}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  officer_id BIGINT NOT NULL REFERENCES officers(id) ON DELETE RESTRICT,
  full_name VARCHAR(120) NOT NULL,
  idno VARCHAR(50) NOT NULL UNIQUE CHECK (idno ~ '^\\d{12}$'),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_matches (
  id BIGSERIAL PRIMARY KEY,
  agent_submission_id BIGINT UNIQUE NOT NULL REFERENCES agent_submissions(id) ON DELETE CASCADE,
  registration_id BIGINT UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  agent_id BIGINT NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  officer_id BIGINT NOT NULL REFERENCES officers(id) ON DELETE RESTRICT,
  commission_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_supervisor_id ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_officers_supervisor_id ON officers(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_agents_created_by_supervisor ON agents(created_by_supervisor);
CREATE INDEX IF NOT EXISTS idx_agent_submissions_idno ON agent_submissions(idno);
CREATE INDEX IF NOT EXISTS idx_registrations_idno ON registrations(idno);
CREATE INDEX IF NOT EXISTS idx_registrations_officer_created_at ON registrations(officer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_matches_agent_created_at ON commission_matches(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_matches_officer_created_at ON commission_matches(officer_id, created_at);
