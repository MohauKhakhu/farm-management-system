exports.up = function(knex) {
  return knex.schema
    .createTable('sustainability_metrics', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('metric_name').notNullable();
      table.text('description');
      table.string('category'); // carbon, water, energy, waste, biodiversity
      table.string('unit_of_measure');
      table.string('calculation_method');
      table.decimal('baseline_value', 12, 4);
      table.decimal('target_value', 12, 4);
      table.date('target_date');
      table.timestamps(true, true);
    })
    .createTable('sustainability_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('metric_id').references('id').inTable('sustainability_metrics');
      table.date('record_date').notNullable();
      table.decimal('value', 12, 4).notNullable();
      table.string('measurement_method');
      table.text('notes');
      table.uuid('recorded_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('carbon_footprint_activities', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('activity_type').notNullable(); // fuel_use, electricity, fertilizer, etc.
      table.date('activity_date').notNullable();
      table.decimal('quantity', 12, 4).notNullable();
      table.string('unit');
      table.decimal('emission_factor', 8, 6); // CO2 equivalent per unit
      table.decimal('co2_equivalent', 12, 4); // calculated emissions
      table.string('source'); // where emission factor came from
      table.text('description');
      table.uuid('recorded_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('water_usage_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('water_source'); // borehole, municipal, river, etc.
      table.string('usage_category'); // irrigation, drinking, cleaning, etc.
      table.date('usage_date').notNullable();
      table.decimal('volume_liters', 12, 2).notNullable();
      table.decimal('cost', 10, 2);
      table.string('meter_reading');
      table.text('notes');
      table.uuid('recorded_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('waste_management_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('waste_type'); // organic, plastic, chemical, etc.
      table.string('waste_category'); // manure, packaging, medical, etc.
      table.date('collection_date').notNullable();
      table.decimal('quantity', 10, 2).notNullable();
      table.string('unit'); // kg, liters, cubic meters
      table.enum('disposal_method', ['composting', 'recycling', 'landfill', 'incineration', 'biogas', 'reuse']);
      table.string('disposal_location');
      table.decimal('disposal_cost', 10, 2);
      table.boolean('hazardous').defaultTo(false);
      table.string('permit_number');
      table.uuid('handled_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('regulatory_requirements', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('regulation_name').notNullable();
      table.string('regulatory_body');
      table.text('description');
      table.string('category'); // environmental, animal_welfare, food_safety, etc.
      table.string('compliance_frequency'); // daily, monthly, annually, etc.
      table.date('effective_date');
      table.date('expiry_date');
      table.boolean('is_mandatory').defaultTo(true);
      table.json('requirements_checklist');
      table.timestamps(true, true);
    })
    .createTable('compliance_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('requirement_id').references('id').inTable('regulatory_requirements');
      table.date('compliance_date').notNullable();
      table.enum('status', ['compliant', 'non_compliant', 'partial', 'pending_review']).defaultTo('pending_review');
      table.json('checklist_results');
      table.text('findings');
      table.text('corrective_actions');
      table.date('next_review_date');
      table.uuid('assessed_by').references('id').inTable('users');
      table.uuid('reviewed_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('audit_trails', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('table_name').notNullable();
      table.string('record_id').notNullable();
      table.enum('action', ['create', 'update', 'delete']).notNullable();
      table.json('old_values');
      table.json('new_values');
      table.datetime('action_timestamp').notNullable();
      table.uuid('user_id').references('id').inTable('users');
      table.string('ip_address');
      table.text('reason');
      table.timestamps(true, true);
      table.index(['table_name', 'record_id']);
      table.index(['action_timestamp']);
    })
    .createTable('certifications', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('certification_name').notNullable();
      table.string('certifying_body');
      table.string('certificate_number');
      table.date('issue_date');
      table.date('expiry_date');
      table.enum('status', ['active', 'expired', 'suspended', 'revoked']).defaultTo('active');
      table.json('scope_of_certification');
      table.decimal('certification_cost', 10, 2);
      table.text('conditions');
      table.string('certificate_file_path');
      table.timestamps(true, true);
    })
    .createTable('inspection_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('certification_id').references('id').inTable('certifications');
      table.date('inspection_date').notNullable();
      table.string('inspector_name');
      table.string('inspector_organization');
      table.enum('inspection_type', ['routine', 'follow_up', 'complaint', 'surveillance']).defaultTo('routine');
      table.json('areas_inspected');
      table.json('findings');
      table.enum('overall_result', ['pass', 'conditional_pass', 'fail']).defaultTo('pass');
      table.text('recommendations');
      table.text('corrective_actions_required');
      table.date('corrective_action_deadline');
      table.boolean('follow_up_required').defaultTo(false);
      table.date('follow_up_date');
      table.string('report_file_path');
      table.timestamps(true, true);
    })
    .createTable('document_repository', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('document_name').notNullable();
      table.string('document_type'); // policy, procedure, certificate, report, etc.
      table.string('category');
      table.text('description');
      table.string('file_path').notNullable();
      table.string('file_type');
      table.integer('file_size');
      table.date('document_date');
      table.date('expiry_date');
      table.string('version');
      table.enum('access_level', ['public', 'internal', 'confidential', 'restricted']).defaultTo('internal');
      table.uuid('uploaded_by').references('id').inTable('users');
      table.uuid('approved_by').references('id').inTable('users');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('document_repository')
    .dropTableIfExists('inspection_records')
    .dropTableIfExists('certifications')
    .dropTableIfExists('audit_trails')
    .dropTableIfExists('compliance_records')
    .dropTableIfExists('regulatory_requirements')
    .dropTableIfExists('waste_management_records')
    .dropTableIfExists('water_usage_records')
    .dropTableIfExists('carbon_footprint_activities')
    .dropTableIfExists('sustainability_records')
    .dropTableIfExists('sustainability_metrics');
};