/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('letter_metrics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('draft_letter_id').references('id').inTable('draft_letters').onDelete('CASCADE');
    table.integer('intensity').defaultTo(5); // 1-10 scale - Strength/forcefulness of language
    table.integer('seriousness').defaultTo(5); // 1-10 scale - Gravity/severity of tone
    table.integer('formality').defaultTo(7); // 1-10 scale - Professional/casual level
    table.integer('clarity').defaultTo(5); // 1-10 scale - Readability and comprehension
    table.integer('persuasiveness').defaultTo(5); // 1-10 scale - Argument strength
    table.integer('empathy').defaultTo(5); // 1-10 scale - Emotional intelligence in communication
    table.integer('structure_quality').defaultTo(5); // 1-10 scale - Organization and flow
    table.integer('legal_precision').defaultTo(5); // 1-10 scale - Accuracy of legal language
    table.timestamp('calculated_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.index('draft_letter_id');
    table.index('calculated_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('letter_metrics');
};

