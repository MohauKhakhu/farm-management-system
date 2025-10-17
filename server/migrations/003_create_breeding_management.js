exports.up = function(knex) {
  return knex.schema
    .createTable('breeding_programs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('objectives');
      table.string('species');
      table.date('start_date');
      table.date('end_date');
      table.enum('status', ['active', 'completed', 'suspended']).defaultTo('active');
      table.timestamps(true, true);
    })
    .createTable('breeding_events', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('program_id').references('id').inTable('breeding_programs').onDelete('CASCADE');
      table.uuid('female_id').references('id').inTable('animals').onDelete('CASCADE');
      table.uuid('male_id').references('id').inTable('animals').onDelete('CASCADE');
      table.date('breeding_date').notNullable();
      table.enum('breeding_method', ['natural', 'artificial_insemination', 'embryo_transfer']);
      table.string('semen_batch_id');
      table.string('technician');
      table.date('expected_calving_date');
      table.date('actual_calving_date');
      table.enum('pregnancy_status', ['unknown', 'confirmed', 'not_pregnant', 'aborted', 'completed']);
      table.date('pregnancy_check_date');
      table.integer('gestation_length');
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('births', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('breeding_event_id').references('id').inTable('breeding_events');
      table.uuid('mother_id').references('id').inTable('animals').onDelete('CASCADE');
      table.uuid('father_id').references('id').inTable('animals');
      table.uuid('offspring_id').references('id').inTable('animals').onDelete('CASCADE');
      table.date('birth_date').notNullable();
      table.time('birth_time');
      table.decimal('birth_weight', 8, 2);
      table.enum('birth_type', ['natural', 'assisted', 'caesarean']);
      table.enum('birth_difficulty', ['easy', 'moderate', 'difficult']);
      table.boolean('live_birth').defaultTo(true);
      table.text('complications');
      table.uuid('attended_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('genetic_tests', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.string('test_type').notNullable();
      table.date('test_date');
      table.string('laboratory');
      table.json('results');
      table.string('certification_number');
      table.decimal('cost', 10, 2);
      table.timestamps(true, true);
    })
    .createTable('performance_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.string('metric_type'); // weight_gain, milk_production, fertility_rate, etc.
      table.decimal('value', 10, 4).notNullable();
      table.string('unit');
      table.date('record_date').notNullable();
      table.string('period'); // daily, weekly, monthly, yearly
      table.text('notes');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('performance_records')
    .dropTableIfExists('genetic_tests')
    .dropTableIfExists('births')
    .dropTableIfExists('breeding_events')
    .dropTableIfExists('breeding_programs');
};