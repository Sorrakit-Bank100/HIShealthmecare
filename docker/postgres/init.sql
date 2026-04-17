-- HIS Database Initialization
-- This script runs automatically when the PostgreSQL container starts for the first time.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB indexing support
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log startup
DO $$
BEGIN
    RAISE NOTICE 'HIS Database initialized successfully.';
END $$;
