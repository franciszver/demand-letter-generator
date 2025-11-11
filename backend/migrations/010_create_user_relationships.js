/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('user_relationships', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('primary_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('secondary_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.timestamps(true, true);
    table.unique(['primary_user_id', 'secondary_user_id']);
    table.index('primary_user_id');
    table.index('secondary_user_id');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('user_relationships');
};

