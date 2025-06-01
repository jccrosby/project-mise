#!/bin/bash

# Database setup script for PostgreSQL + pgvector

echo "Setting up PostgreSQL database with pgvector..."

# Set environment variables
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=mise_dev
export POSTGRES_USER=mise_user
export POSTGRES_PASSWORD=mise_password
export POSTGRES_TEST_DB=mise_test
export POSTGRES_MAX_CONNECTIONS=20
export POSTGRES_IDLE_TIMEOUT=30000
export POSTGRES_CONNECTION_TIMEOUT=5000

# Construct database URL for migrations
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

echo "Database URL: $DATABASE_URL"

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker exec mise-postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"

# Run migrations with explicit environment variable
echo "Running database migrations..."
DATABASE_URL="$DATABASE_URL" pnpm migrate:up

echo "Database setup complete!"
echo ""
echo "You can now start the backend server with:"
echo "POSTGRES_HOST=$POSTGRES_HOST POSTGRES_PORT=$POSTGRES_PORT POSTGRES_DB=$POSTGRES_DB POSTGRES_USER=$POSTGRES_USER POSTGRES_PASSWORD=$POSTGRES_PASSWORD nx serve mise-be"
