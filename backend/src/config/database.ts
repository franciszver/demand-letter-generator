import dotenv from 'dotenv';
import knex from 'knex';
import config from '../../knexfile';

// Ensure environment variables are loaded
dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment as keyof typeof config];

if (!dbConfig) {
  throw new Error(`Database configuration for environment "${environment}" not found`);
}

export const db = knex(dbConfig);

// Connection pool configuration
db.on('query', (query) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('SQL Query:', query.sql);
  }
});

export default db;

