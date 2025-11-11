/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('draft_letters', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('document_id').references('id').inTable('documents').onDelete('SET NULL');
    table.uuid('template_id').references('id').inTable('templates').onDelete('SET NULL');
    table.string('title').notNullable();
    table.text('content_summary');
    table.string('s3_key').notNullable();
    table.integer('version').defaultTo(1);
    table.enum('status', ['draft', 'generated', 'refined', 'final']).defaultTo('draft');
    table.timestamps(true, true);
    table.index('user_id');
    table.index('document_id');
    table.index('template_id');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('draft_letters');
};


