-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app schema for better organization
CREATE SCHEMA IF NOT EXISTS app;

-- Grant permissions to the application user
GRANT USAGE ON SCHEMA app TO mise_user;
GRANT CREATE ON SCHEMA app TO mise_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO mise_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO mise_user;

-- Create a function to automatically grant permissions on new objects
CREATE OR REPLACE FUNCTION app.grant_permissions_to_app_user()
RETURNS event_trigger AS $$
BEGIN
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO mise_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO mise_user;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO mise_user;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger to automatically grant permissions
CREATE EVENT TRIGGER grant_permissions_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE SEQUENCE', 'CREATE FUNCTION')
  EXECUTE FUNCTION app.grant_permissions_to_app_user();
