/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('case_context', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('draft_letter_id').references('id').inTable('draft_letters').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('relationship_dynamics'); // Description of relationship with recipient
    table.integer('urgency_level').defaultTo(5); // 1-10 scale
    table.text('previous_interactions'); // History of previous communications
    table.string('case_sensitivity'); // e.g., 'high', 'medium', 'low'
    table.string('target_recipient_role'); // Role of the recipient
    table.string('target_recipient_org'); // Organization of the recipient
    table.string('target_relationship'); // Relationship type (e.g., 'adversary', 'client', 'colleague')
    table.timestamps(true, true);
    table.index('draft_letter_id');
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('case_context');
};

