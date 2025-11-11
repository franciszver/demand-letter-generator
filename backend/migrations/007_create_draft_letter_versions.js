/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('draft_letter_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('draft_letter_id').references('id').inTable('draft_letters').onDelete('CASCADE');
    table.integer('version_number').notNullable();
    table.text('content').notNullable(); // Full content snapshot
    table.string('s3_key').nullable(); // S3 key for content storage
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('change_summary').nullable(); // Brief description of changes
    table.timestamps(true, true);
    table.index('draft_letter_id');
    table.index(['draft_letter_id', 'version_number']);
    table.unique(['draft_letter_id', 'version_number']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('draft_letter_versions');
};

