exports.up = function(knex) {
  return knex.schema
    .createTable('feed_ingredients', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.string('category'); // protein, energy, mineral, vitamin, etc.
      table.decimal('protein_content', 5, 2); // percentage
      table.decimal('energy_content', 8, 2); // MJ/kg or similar
      table.decimal('moisture_content', 5, 2); // percentage
      table.json('nutritional_profile');
      table.decimal('cost_per_unit', 10, 4);
      table.string('unit'); // kg, ton, etc.
      table.timestamps(true, true);
    })
    .createTable('feed_formulations', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('target_species');
      table.string('target_category'); // starter, grower, finisher, lactating, etc.
      table.text('description');
      table.decimal('target_protein', 5, 2);
      table.decimal('target_energy', 8, 2);
      table.json('nutritional_targets');
      table.decimal('cost_per_kg', 10, 4);
      table.boolean('is_active').defaultTo(true);
      table.uuid('created_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('feed_formulation_ingredients', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('formulation_id').references('id').inTable('feed_formulations').onDelete('CASCADE');
      table.uuid('ingredient_id').references('id').inTable('feed_ingredients');
      table.decimal('percentage', 5, 2).notNullable(); // percentage in formulation
      table.decimal('kg_per_ton', 8, 2); // actual amount per ton
      table.timestamps(true, true);
    })
    .createTable('feed_production_batches', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('formulation_id').references('id').inTable('feed_formulations');
      table.string('batch_number').unique().notNullable();
      table.date('production_date').notNullable();
      table.decimal('batch_size_kg', 10, 2).notNullable();
      table.decimal('actual_cost', 12, 2);
      table.json('quality_parameters');
      table.text('production_notes');
      table.uuid('produced_by').references('id').inTable('users');
      table.enum('status', ['planned', 'in_progress', 'completed', 'quality_hold', 'rejected']).defaultTo('planned');
      table.timestamps(true, true);
    })
    .createTable('feed_consumption_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.uuid('batch_id').references('id').inTable('feed_production_batches');
      table.date('consumption_date').notNullable();
      table.decimal('quantity_kg', 8, 2).notNullable();
      table.string('feeding_period'); // morning, afternoon, evening
      table.text('notes');
      table.uuid('recorded_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('feeding_schedules', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('target_group'); // age group, production stage, etc.
      table.json('schedule_details'); // times, quantities, formulations
      table.boolean('is_active').defaultTo(true);
      table.date('start_date');
      table.date('end_date');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('feeding_schedules')
    .dropTableIfExists('feed_consumption_records')
    .dropTableIfExists('feed_production_batches')
    .dropTableIfExists('feed_formulation_ingredients')
    .dropTableIfExists('feed_formulations')
    .dropTableIfExists('feed_ingredients');
};