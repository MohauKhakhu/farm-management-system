exports.up = function(knex) {
  return knex.schema
    .createTable('fields', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description');
      table.decimal('area_hectares', 10, 4);
      table.json('coordinates'); // GPS coordinates for field boundaries
      table.string('soil_type');
      table.decimal('soil_ph', 4, 2);
      table.json('soil_analysis');
      table.string('irrigation_type'); // drip, sprinkler, flood, rain-fed
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('crops', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('variety');
      table.string('category'); // cereal, legume, vegetable, fruit, etc.
      table.integer('growing_season_days');
      table.json('planting_requirements');
      table.json('nutritional_needs');
      table.decimal('expected_yield_per_hectare', 10, 2);
      table.string('yield_unit');
      table.timestamps(true, true);
    })
    .createTable('crop_seasons', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('field_id').references('id').inTable('fields').onDelete('CASCADE');
      table.uuid('crop_id').references('id').inTable('crops');
      table.string('season_name'); // 2024 Summer, 2024/25 Winter, etc.
      table.date('planting_date');
      table.date('expected_harvest_date');
      table.date('actual_harvest_date');
      table.decimal('area_planted_hectares', 10, 4);
      table.decimal('seed_quantity_used', 10, 2);
      table.string('seed_variety');
      table.decimal('expected_yield', 12, 2);
      table.decimal('actual_yield', 12, 2);
      table.string('yield_unit');
      table.enum('status', ['planned', 'planted', 'growing', 'harvested', 'failed']).defaultTo('planned');
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('field_activities', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('field_id').references('id').inTable('fields').onDelete('CASCADE');
      table.uuid('season_id').references('id').inTable('crop_seasons');
      table.date('activity_date').notNullable();
      table.enum('activity_type', ['planting', 'irrigation', 'fertilizing', 'pest_control', 'weeding', 'harvesting', 'soil_preparation', 'other']);
      table.text('description').notNullable();
      table.decimal('quantity_applied', 10, 2); // for fertilizer, pesticide, etc.
      table.string('product_used');
      table.decimal('cost', 10, 2);
      table.string('equipment_used');
      table.decimal('labor_hours', 8, 2);
      table.uuid('performed_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('irrigation_schedules', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('field_id').references('id').inTable('fields').onDelete('CASCADE');
      table.uuid('season_id').references('id').inTable('crop_seasons');
      table.string('schedule_name');
      table.json('watering_times'); // array of times per day
      table.decimal('water_amount_per_session', 8, 2); // liters or mm
      table.string('frequency'); // daily, every 2 days, weekly, etc.
      table.date('start_date');
      table.date('end_date');
      table.boolean('is_active').defaultTo(true);
      table.boolean('weather_dependent').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('irrigation_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('schedule_id').references('id').inTable('irrigation_schedules');
      table.uuid('field_id').references('id').inTable('fields').onDelete('CASCADE');
      table.datetime('irrigation_start').notNullable();
      table.datetime('irrigation_end');
      table.decimal('water_amount_used', 10, 2);
      table.string('water_source');
      table.decimal('water_pressure', 6, 2);
      table.text('notes');
      table.boolean('completed').defaultTo(true);
      table.uuid('operated_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('pest_disease_scouting', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('field_id').references('id').inTable('fields').onDelete('CASCADE');
      table.uuid('season_id').references('id').inTable('crop_seasons');
      table.date('scouting_date').notNullable();
      table.string('pest_disease_name');
      table.enum('type', ['pest', 'disease', 'weed', 'nutrient_deficiency']);
      table.enum('severity', ['none', 'low', 'medium', 'high', 'severe']);
      table.decimal('affected_area_percentage', 5, 2);
      table.text('symptoms_observed');
      table.json('location_coordinates'); // GPS points where found
      table.string('weather_conditions');
      table.text('recommended_action');
      table.string('image_path'); // path to uploaded images
      table.uuid('scouted_by').references('id').inTable('users');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pest_disease_scouting')
    .dropTableIfExists('irrigation_records')
    .dropTableIfExists('irrigation_schedules')
    .dropTableIfExists('field_activities')
    .dropTableIfExists('crop_seasons')
    .dropTableIfExists('crops')
    .dropTableIfExists('fields');
};