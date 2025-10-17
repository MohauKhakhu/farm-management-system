exports.up = function(knex) {
  return knex.schema
    .createTable('inventory_categories', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.string('category_type'); // feed, medicine, equipment, supplies
      table.timestamps(true, true);
    })
    .createTable('suppliers', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('contact_person');
      table.string('email');
      table.string('phone');
      table.text('address');
      table.string('tax_number');
      table.json('payment_terms');
      table.decimal('credit_limit', 12, 2);
      table.enum('status', ['active', 'inactive', 'blacklisted']).defaultTo('active');
      table.timestamps(true, true);
    })
    .createTable('inventory_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('category_id').references('id').inTable('inventory_categories');
      table.string('name').notNullable();
      table.string('sku').unique();
      table.text('description');
      table.string('unit_of_measure'); // kg, liters, pieces, etc.
      table.decimal('current_stock', 12, 3).defaultTo(0);
      table.decimal('minimum_stock', 12, 3).defaultTo(0);
      table.decimal('maximum_stock', 12, 3);
      table.decimal('reorder_point', 12, 3);
      table.decimal('reorder_quantity', 12, 3);
      table.decimal('unit_cost', 10, 2);
      table.string('storage_location');
      table.json('storage_conditions'); // temperature, humidity requirements
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('inventory_batches', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('item_id').references('id').inTable('inventory_items').onDelete('CASCADE');
      table.string('batch_number').notNullable();
      table.date('manufacture_date');
      table.date('expiry_date');
      table.decimal('quantity', 12, 3).notNullable();
      table.decimal('unit_cost', 10, 2);
      table.uuid('supplier_id').references('id').inTable('suppliers');
      table.string('purchase_order_number');
      table.enum('status', ['available', 'reserved', 'expired', 'recalled']).defaultTo('available');
      table.timestamps(true, true);
    })
    .createTable('inventory_transactions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('item_id').references('id').inTable('inventory_items').onDelete('CASCADE');
      table.uuid('batch_id').references('id').inTable('inventory_batches');
      table.enum('transaction_type', ['purchase', 'usage', 'adjustment', 'transfer', 'waste', 'return']);
      table.decimal('quantity', 12, 3).notNullable();
      table.decimal('unit_cost', 10, 2);
      table.date('transaction_date').notNullable();
      table.string('reference_number');
      table.text('notes');
      table.uuid('performed_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('purchase_orders', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('po_number').unique().notNullable();
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('supplier_id').references('id').inTable('suppliers');
      table.date('order_date').notNullable();
      table.date('expected_delivery_date');
      table.date('actual_delivery_date');
      table.enum('status', ['draft', 'sent', 'confirmed', 'partially_received', 'completed', 'cancelled']).defaultTo('draft');
      table.decimal('total_amount', 12, 2);
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('purchase_order_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('purchase_order_id').references('id').inTable('purchase_orders').onDelete('CASCADE');
      table.uuid('item_id').references('id').inTable('inventory_items');
      table.decimal('quantity_ordered', 12, 3).notNullable();
      table.decimal('quantity_received', 12, 3).defaultTo(0);
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 12, 2).notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('purchase_order_items')
    .dropTableIfExists('purchase_orders')
    .dropTableIfExists('inventory_transactions')
    .dropTableIfExists('inventory_batches')
    .dropTableIfExists('inventory_items')
    .dropTableIfExists('suppliers')
    .dropTableIfExists('inventory_categories');
};