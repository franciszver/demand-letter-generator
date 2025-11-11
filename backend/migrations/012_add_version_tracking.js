/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.table('draft_letters', (table) => {
    // Add last_modified_by column (user who last modified)
    table.uuid('last_modified_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Add last_modified_at timestamp
    table.timestamp('last_modified_at').defaultTo(knex.fn.now());
    
    // Add index on version for quick conflict checks
    table.index('version');
    table.index('last_modified_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.table('draft_letters', (table) => {
    table.dropIndex('last_modified_at');
    table.dropIndex('version');
    table.dropColumn('last_modified_at');
    table.dropColumn('last_modified_by');
  });
};

