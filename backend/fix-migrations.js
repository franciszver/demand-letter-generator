/**
 * Fix migration tracking table by removing entries for migrations that don't exist
 */
require('dotenv').config();
const knex = require('knex')(require('./knexfile.js').development);

const missingMigrations = [
  '006_create_prompts.js',
  '007_create_draft_letter_versions.js',
  '010_create_webhooks.js',
  '011_create_analytics_events.js',
  '012_add_user_approval_status.js',
];

async function fixMigrations() {
  try {
    console.log('Removing missing migration entries from knex_migrations table...');
    
    for (const migrationName of missingMigrations) {
      const deleted = await knex('knex_migrations')
        .where('name', migrationName)
        .del();
      
      if (deleted > 0) {
        console.log(`✓ Removed: ${migrationName}`);
      }
    }
    
    console.log('\nMigration table fixed! You can now run: npm run migrate');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing migrations:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

fixMigrations();

