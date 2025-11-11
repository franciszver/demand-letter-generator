/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('analytics_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('event_type').notNullable(); // 'letter_generated', 'letter_refined', 'letter_exported', 'template_created', etc.
    table.jsonb('event_data').defaultTo('{}'); // Additional event-specific data
    table.string('entity_type').nullable(); // 'draft_letter', 'template', 'document', etc.
    table.uuid('entity_id').nullable(); // ID of the related entity
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('user_id');
    table.index('event_type');
    table.index('created_at');
    table.index(['event_type', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('analytics_events');
};

