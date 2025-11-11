/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('original_name').notNullable();
    table.string('file_type').notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('s3_key').notNullable();
    table.text('extracted_text');
    table.enum('status', ['uploading', 'processing', 'completed', 'failed']).defaultTo('uploading');
    table.timestamps(true, true);
    table.index('user_id');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('documents');
};


