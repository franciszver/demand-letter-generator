/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('refinement_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('draft_letter_id').references('id').inTable('draft_letters').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('prompt_text').notNullable(); // The refinement instruction/prompt
    table.text('response_text'); // The refined content (or reference to S3)
    table.integer('version').notNullable(); // Version number of this refinement
    table.jsonb('metrics_before'); // Metrics before refinement
    table.jsonb('metrics_after'); // Metrics after refinement
    table.timestamps(true, true);
    table.index('draft_letter_id');
    table.index('user_id');
    table.index('version');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('refinement_history');
};

