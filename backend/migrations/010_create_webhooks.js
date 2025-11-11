/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('webhooks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('url').notNullable();
    table.jsonb('events').defaultTo('[]'); // Array of event types to listen for
    table.string('secret').nullable(); // Webhook secret for verification
    table.boolean('active').defaultTo(true);
    table.integer('retry_count').defaultTo(0);
    table.timestamp('last_triggered_at').nullable();
    table.timestamps(true, true);
    table.index('user_id');
    table.index('active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('webhooks');
};

