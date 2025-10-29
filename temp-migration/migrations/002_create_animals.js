exports.up = function(knex) {
  return knex.schema
    .createTable('animal_breeds', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('species').notNullable(); // cattle, sheep, goat, pig, etc.
      table.text('description');
      table.json('characteristics');
      table.timestamps(true, true);
    })
    .createTable('animals', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('tag_id').unique().notNullable(); // Physical tag/RFID
      table.string('name');
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('breed_id').references('id').inTable('animal_breeds');
      table.enum('gender', ['male', 'female']).notNullable();
      table.date('birth_date');
      table.decimal('birth_weight', 8, 2);
      table.decimal('current_weight', 8, 2);
      table.string('color');
      table.text('markings');
      table.enum('status', ['active', 'sold', 'deceased', 'transferred']).defaultTo('active');
      table.uuid('mother_id').references('id').inTable('animals');
      table.uuid('father_id').references('id').inTable('animals');
      table.json('genetic_traits');
      table.string('acquisition_method'); // born, purchased, transferred
      table.date('acquisition_date');
      table.decimal('acquisition_cost', 10, 2);
      table.string('source_farm');
      table.timestamps(true, true);
    })
    .createTable('animal_health_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.date('record_date').notNullable();
      table.enum('record_type', ['vaccination', 'treatment', 'checkup', 'illness', 'injury', 'other']);
      table.string('condition_diagnosis');
      table.text('symptoms');
      table.text('treatment_given');
      table.string('medication');
      table.string('dosage');
      table.string('veterinarian');
      table.decimal('cost', 10, 2);
      table.date('next_checkup_date');
      table.text('notes');
      table.uuid('recorded_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('animal_weights', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.date('weigh_date').notNullable();
      table.decimal('weight', 8, 2).notNullable();
      table.string('weight_unit').defaultTo('kg');
      table.text('notes');
      table.uuid('recorded_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('animal_movements', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.date('movement_date').notNullable();
      table.string('from_location');
      table.string('to_location');
      table.enum('movement_type', ['field_change', 'sale', 'purchase', 'transfer', 'feedlot_entry', 'feedlot_exit']);
      table.text('reason');
      table.uuid('authorized_by').references('id').inTable('users');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('animal_movements')
    .dropTableIfExists('animal_weights')
    .dropTableIfExists('animal_health_records')
    .dropTableIfExists('animals')
    .dropTableIfExists('animal_breeds');
};