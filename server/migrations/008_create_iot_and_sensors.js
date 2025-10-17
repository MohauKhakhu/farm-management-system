exports.up = function(knex) {
  return knex.schema
    .createTable('sensor_types', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.string('measurement_type'); // temperature, humidity, weight, motion, etc.
      table.string('unit_of_measure');
      table.decimal('min_value', 10, 4);
      table.decimal('max_value', 10, 4);
      table.decimal('accuracy', 6, 4);
      table.timestamps(true, true);
    })
    .createTable('sensors', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('sensor_type_id').references('id').inTable('sensor_types');
      table.string('device_id').unique().notNullable(); // unique hardware identifier
      table.string('name').notNullable();
      table.text('description');
      table.string('location'); // barn 1, field A, water tank 2, etc.
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.string('installation_date');
      table.enum('status', ['active', 'inactive', 'maintenance', 'faulty']).defaultTo('active');
      table.integer('battery_level'); // percentage
      table.datetime('last_communication');
      table.json('configuration'); // sensor-specific settings
      table.decimal('alert_min_threshold', 10, 4);
      table.decimal('alert_max_threshold', 10, 4);
      table.timestamps(true, true);
    })
    .createTable('sensor_readings', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sensor_id').references('id').inTable('sensors').onDelete('CASCADE');
      table.datetime('reading_timestamp').notNullable();
      table.decimal('value', 12, 6).notNullable();
      table.string('unit');
      table.json('raw_data'); // original sensor data if needed
      table.boolean('is_valid').defaultTo(true);
      table.text('notes');
      table.index(['sensor_id', 'reading_timestamp']);
      table.timestamps(true, true);
    })
    .createTable('sensor_alerts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sensor_id').references('id').inTable('sensors').onDelete('CASCADE');
      table.uuid('reading_id').references('id').inTable('sensor_readings');
      table.enum('alert_type', ['threshold_exceeded', 'threshold_below', 'sensor_offline', 'battery_low', 'anomaly_detected']);
      table.enum('severity', ['info', 'warning', 'critical', 'emergency']).defaultTo('warning');
      table.datetime('alert_timestamp').notNullable();
      table.text('message').notNullable();
      table.decimal('trigger_value', 12, 6);
      table.boolean('acknowledged').defaultTo(false);
      table.datetime('acknowledged_at');
      table.uuid('acknowledged_by').references('id').inTable('users');
      table.boolean('resolved').defaultTo(false);
      table.datetime('resolved_at');
      table.text('resolution_notes');
      table.timestamps(true, true);
    })
    .createTable('wearable_devices', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.string('device_id').unique().notNullable();
      table.string('device_type'); // collar, ear_tag, bolus, etc.
      table.string('manufacturer');
      table.string('model');
      table.date('installation_date');
      table.date('last_maintenance_date');
      table.date('next_maintenance_date');
      table.integer('battery_level');
      table.enum('status', ['active', 'inactive', 'lost', 'maintenance']).defaultTo('active');
      table.json('capabilities'); // what it can measure
      table.timestamps(true, true);
    })
    .createTable('animal_sensor_data', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('device_id').references('id').inTable('wearable_devices').onDelete('CASCADE');
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.datetime('timestamp').notNullable();
      table.decimal('activity_level', 8, 4); // steps, movement intensity
      table.decimal('body_temperature', 5, 2);
      table.decimal('heart_rate', 6, 2);
      table.integer('rumination_minutes');
      table.decimal('location_lat', 10, 8);
      table.decimal('location_lng', 11, 8);
      table.boolean('feeding_detected').defaultTo(false);
      table.boolean('drinking_detected').defaultTo(false);
      table.enum('behavior_classification', ['resting', 'feeding', 'walking', 'running', 'abnormal']);
      table.json('raw_sensor_data');
      table.index(['animal_id', 'timestamp']);
      table.timestamps(true, true);
    })
    .createTable('environmental_conditions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('location'); // barn, field, storage, etc.
      table.datetime('recorded_at').notNullable();
      table.decimal('temperature', 5, 2);
      table.decimal('humidity', 5, 2);
      table.decimal('air_pressure', 8, 2);
      table.decimal('wind_speed', 6, 2);
      table.decimal('wind_direction', 5, 1);
      table.decimal('rainfall', 6, 2);
      table.decimal('light_intensity', 8, 2);
      table.decimal('co2_level', 8, 2);
      table.decimal('ammonia_level', 8, 4);
      table.json('additional_parameters');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('environmental_conditions')
    .dropTableIfExists('animal_sensor_data')
    .dropTableIfExists('wearable_devices')
    .dropTableIfExists('sensor_alerts')
    .dropTableIfExists('sensor_readings')
    .dropTableIfExists('sensors')
    .dropTableIfExists('sensor_types');
};