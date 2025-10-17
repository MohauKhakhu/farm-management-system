exports.up = function(knex) {
  return knex.schema
    .createTable('vaccines', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('manufacturer');
      table.string('disease_target');
      table.text('description');
      table.string('administration_method'); // injection, oral, nasal, etc.
      table.decimal('dosage_per_animal', 8, 3);
      table.string('dosage_unit');
      table.integer('immunity_duration_days');
      table.integer('withdrawal_period_days');
      table.json('storage_requirements');
      table.decimal('cost_per_dose', 8, 2);
      table.timestamps(true, true);
    })
    .createTable('vaccination_programs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('target_species');
      table.string('target_group'); // age group, production stage
      table.text('description');
      table.boolean('is_mandatory').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('vaccination_schedules', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('program_id').references('id').inTable('vaccination_programs').onDelete('CASCADE');
      table.uuid('vaccine_id').references('id').inTable('vaccines');
      table.integer('age_at_vaccination_days'); // age when vaccine should be given
      table.integer('repeat_interval_days'); // for booster shots
      table.integer('max_repeats'); // maximum number of boosters
      table.boolean('is_seasonal').defaultTo(false);
      table.string('preferred_season');
      table.timestamps(true, true);
    })
    .createTable('vaccination_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('animal_id').references('id').inTable('animals').onDelete('CASCADE');
      table.uuid('vaccine_id').references('id').inTable('vaccines');
      table.uuid('schedule_id').references('id').inTable('vaccination_schedules');
      table.date('vaccination_date').notNullable();
      table.string('batch_number');
      table.date('expiry_date');
      table.decimal('dosage_given', 8, 3);
      table.string('administration_site');
      table.string('veterinarian');
      table.text('adverse_reactions');
      table.date('next_due_date');
      table.uuid('administered_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('disease_outbreaks', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('disease_name').notNullable();
      table.date('outbreak_date').notNullable();
      table.date('containment_date');
      table.date('resolution_date');
      table.enum('severity', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
      table.integer('animals_affected');
      table.integer('animals_recovered');
      table.integer('animals_died');
      table.text('symptoms_observed');
      table.text('containment_measures');
      table.text('treatment_protocol');
      table.decimal('financial_impact', 12, 2);
      table.boolean('authorities_notified').defaultTo(false);
      table.date('notification_date');
      table.enum('status', ['active', 'contained', 'resolved']).defaultTo('active');
      table.uuid('reported_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('visitor_logs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('visitor_name').notNullable();
      table.string('visitor_company');
      table.string('visitor_phone');
      table.string('purpose_of_visit').notNullable();
      table.datetime('entry_time').notNullable();
      table.datetime('exit_time');
      table.string('areas_visited');
      table.boolean('biosecurity_measures_followed').defaultTo(true);
      table.text('biosecurity_notes');
      table.string('vehicle_registration');
      table.boolean('vehicle_disinfected').defaultTo(false);
      table.uuid('authorized_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('biosecurity_protocols', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('protocol_name').notNullable();
      table.string('category'); // entry, exit, cleaning, quarantine, etc.
      table.text('description').notNullable();
      table.json('steps'); // detailed steps to follow
      table.string('frequency'); // daily, weekly, per visit, etc.
      table.boolean('is_mandatory').defaultTo(true);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('biosecurity_compliance', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('protocol_id').references('id').inTable('biosecurity_protocols').onDelete('CASCADE');
      table.date('compliance_date').notNullable();
      table.boolean('completed').defaultTo(false);
      table.json('checklist_results'); // results for each step
      table.text('notes');
      table.uuid('performed_by').references('id').inTable('users');
      table.uuid('verified_by').references('id').inTable('users');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('biosecurity_compliance')
    .dropTableIfExists('biosecurity_protocols')
    .dropTableIfExists('visitor_logs')
    .dropTableIfExists('disease_outbreaks')
    .dropTableIfExists('vaccination_records')
    .dropTableIfExists('vaccination_schedules')
    .dropTableIfExists('vaccination_programs')
    .dropTableIfExists('vaccines');
};