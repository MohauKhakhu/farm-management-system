exports.up = function(knex) {
  return knex.schema
    .createTable('blockchain_networks', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('network_name').notNullable();
      table.string('network_type'); // ethereum, polygon, private, etc.
      table.string('rpc_url').notNullable();
      table.string('chain_id');
      table.string('contract_address');
      table.json('contract_abi');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('traceability_events', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('event_type').notNullable(); // birth, vaccination, feeding, movement, slaughter, processing, etc.
      table.string('entity_type').notNullable(); // animal, batch, product
      table.string('entity_id').notNullable(); // ID of the traced entity
      table.datetime('event_timestamp').notNullable();
      table.string('location');
      table.json('event_data'); // detailed event information
      table.string('previous_event_hash');
      table.string('event_hash').unique().notNullable();
      table.uuid('recorded_by').references('id').inTable('users');
      table.boolean('blockchain_synced').defaultTo(false);
      table.string('blockchain_tx_hash');
      table.datetime('blockchain_timestamp');
      table.timestamps(true, true);
      table.index(['entity_type', 'entity_id']);
      table.index(['event_timestamp']);
    })
    .createTable('product_batches', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('batch_number').unique().notNullable();
      table.string('product_type'); // meat, milk, eggs, crops, etc.
      table.string('product_name');
      table.date('production_date').notNullable();
      table.date('expiry_date');
      table.decimal('quantity', 12, 3).notNullable();
      table.string('unit');
      table.json('source_animals'); // array of animal IDs that contributed
      table.json('processing_steps');
      table.json('quality_parameters');
      table.string('packaging_type');
      table.json('storage_conditions');
      table.enum('status', ['production', 'quality_hold', 'approved', 'shipped', 'recalled']).defaultTo('production');
      table.timestamps(true, true);
    })
    .createTable('supply_chain_participants', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('participant_name').notNullable();
      table.enum('participant_type', ['farm', 'processor', 'distributor', 'retailer', 'restaurant', 'consumer']).notNullable();
      table.string('registration_number');
      table.json('contact_information');
      table.json('certifications');
      table.string('blockchain_address');
      table.boolean('verified').defaultTo(false);
      table.date('verification_date');
      table.timestamps(true, true);
    })
    .createTable('supply_chain_transfers', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('batch_id').references('id').inTable('product_batches').onDelete('CASCADE');
      table.uuid('from_participant_id').references('id').inTable('supply_chain_participants');
      table.uuid('to_participant_id').references('id').inTable('supply_chain_participants');
      table.datetime('transfer_timestamp').notNullable();
      table.decimal('quantity_transferred', 12, 3).notNullable();
      table.string('transport_method');
      table.json('transport_conditions');
      table.string('transfer_document_number');
      table.json('quality_checks');
      table.string('transfer_hash').unique().notNullable();
      table.boolean('blockchain_synced').defaultTo(false);
      table.string('blockchain_tx_hash');
      table.timestamps(true, true);
    })
    .createTable('qr_codes', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('qr_code').unique().notNullable();
      table.enum('entity_type', ['animal', 'batch', 'product', 'field']).notNullable();
      table.string('entity_id').notNullable();
      table.json('embedded_data');
      table.date('generation_date').notNullable();
      table.date('expiry_date');
      table.boolean('is_active').defaultTo(true);
      table.integer('scan_count').defaultTo(0);
      table.datetime('last_scanned');
      table.timestamps(true, true);
    })
    .createTable('qr_code_scans', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('qr_code_id').references('id').inTable('qr_codes').onDelete('CASCADE');
      table.datetime('scan_timestamp').notNullable();
      table.string('scanner_ip');
      table.string('scanner_location');
      table.json('scanner_device_info');
      table.uuid('scanned_by').references('id').inTable('users');
      table.string('scan_purpose'); // verification, tracking, consumer_info, etc.
      table.timestamps(true, true);
    })
    .createTable('consumer_interactions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('qr_code_id').references('id').inTable('qr_codes');
      table.uuid('batch_id').references('id').inTable('product_batches');
      table.datetime('interaction_timestamp').notNullable();
      table.string('consumer_id'); // anonymous or registered consumer ID
      table.enum('interaction_type', ['scan', 'feedback', 'complaint', 'inquiry']).notNullable();
      table.json('interaction_data');
      table.string('consumer_location');
      table.integer('rating'); // 1-5 star rating
      table.text('feedback_text');
      table.timestamps(true, true);
    })
    .createTable('blockchain_transactions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('network_id').references('id').inTable('blockchain_networks');
      table.string('transaction_hash').unique().notNullable();
      table.string('block_number');
      table.string('from_address');
      table.string('to_address');
      table.json('transaction_data');
      table.datetime('timestamp').notNullable();
      table.decimal('gas_used', 20, 0);
      table.decimal('gas_price', 20, 0);
      table.enum('status', ['pending', 'confirmed', 'failed']).defaultTo('pending');
      table.string('related_entity_type'); // traceability_event, supply_chain_transfer
      table.string('related_entity_id');
      table.timestamps(true, true);
    })
    .createTable('smart_contracts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('network_id').references('id').inTable('blockchain_networks');
      table.string('contract_name').notNullable();
      table.string('contract_address').notNullable();
      table.json('contract_abi').notNullable();
      table.string('contract_version');
      table.text('description');
      table.date('deployment_date');
      table.string('deployment_tx_hash');
      table.boolean('is_active').defaultTo(true);
      table.json('functions_available');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('smart_contracts')
    .dropTableIfExists('blockchain_transactions')
    .dropTableIfExists('consumer_interactions')
    .dropTableIfExists('qr_code_scans')
    .dropTableIfExists('qr_codes')
    .dropTableIfExists('supply_chain_transfers')
    .dropTableIfExists('supply_chain_participants')
    .dropTableIfExists('product_batches')
    .dropTableIfExists('traceability_events')
    .dropTableIfExists('blockchain_networks');
};