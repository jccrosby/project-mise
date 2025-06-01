const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'mise_dev',
    user: process.env.POSTGRES_USER || 'mise_user',
    password: process.env.POSTGRES_PASSWORD || 'mise_password',
  });

  try {
    console.log('Testing database connection...');

    // Test basic connection
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version);

    // Test pgvector extension
    const vectorTest = await pool.query(
      "SELECT vector_dims('[1,2,3]'::vector)"
    );
    console.log(
      '✅ pgvector extension working! Vector dimension:',
      vectorTest.rows[0].vector_dims
    );

    // Test app schema
    const schemaTest = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'app'"
    );
    console.log('✅ App schema exists:', schemaTest.rows.length > 0);

    // Test vector functions
    const funcTest = await pool.query(
      "SELECT app.cosine_similarity('[1,2,3]'::vector, '[1,2,3]'::vector) as similarity"
    );
    console.log(
      '✅ Vector functions working! Cosine similarity:',
      funcTest.rows[0].similarity
    );
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
