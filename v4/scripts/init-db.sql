-- Database initialization script for Astral Draft V4
-- This script is run when the Docker container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create indexes for better performance
-- These will be created by Prisma migrations, but included here for completeness

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Prisma will handle the actual table creation and migrations
-- This script just sets up the basic database environment