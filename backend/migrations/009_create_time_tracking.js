/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('time_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('draft_letter_id').references('id').inTable('draft_letters').onDelete('CASCADE');
    table.string('action_type').notNullable(); // 'upload', 'generate', 'refine', 'export'
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time');
    table.integer('estimated_manual_time'); // Estimated time in minutes if done manually
    table.integer('user_reported_time'); // User-reported time in minutes
    table.integer('time_saved'); // Calculated time saved in minutes
    table.timestamps(true, true);
    table.index('user_id');
    table.index('draft_letter_id');
    table.index('action_type');
    table.index('start_time');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('time_tracking');
};

