/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('user_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('communication_style'); // e.g., 'direct', 'diplomatic', 'collaborative'
    table.string('preferred_tone'); // e.g., 'formal', 'informal', 'assertive', 'passive'
    table.integer('formality_level').defaultTo(7); // 1-10 scale
    table.integer('urgency_tendency').defaultTo(5); // 1-10 scale
    table.integer('empathy_preference').defaultTo(5); // 1-10 scale
    table.text('notes'); // Additional preferences or notes
    table.timestamps(true, true);
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('user_profiles');
};

