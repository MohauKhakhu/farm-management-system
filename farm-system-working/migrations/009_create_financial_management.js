exports.up = function(knex) {
  return knex.schema
    .createTable('account_categories', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('code').unique().notNullable();
      table.enum('type', ['asset', 'liability', 'equity', 'income', 'expense']).notNullable();
      table.text('description');
      table.uuid('parent_category_id').references('id').inTable('account_categories');
      table.timestamps(true, true);
    })
    .createTable('accounts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('category_id').references('id').inTable('account_categories');
      table.string('name').notNullable();
      table.string('code').notNullable();
      table.text('description');
      table.decimal('opening_balance', 15, 2).defaultTo(0);
      table.decimal('current_balance', 15, 2).defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.unique(['farm_id', 'code']);
    })
    .createTable('transactions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('transaction_number').unique().notNullable();
      table.date('transaction_date').notNullable();
      table.text('description').notNullable();
      table.string('reference_number');
      table.enum('type', ['income', 'expense', 'transfer', 'adjustment']).notNullable();
      table.decimal('total_amount', 15, 2).notNullable();
      table.enum('status', ['draft', 'pending', 'completed', 'cancelled']).defaultTo('completed');
      table.uuid('created_by').references('id').inTable('users');
      table.uuid('approved_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('transaction_entries', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('transaction_id').references('id').inTable('transactions').onDelete('CASCADE');
      table.uuid('account_id').references('id').inTable('accounts');
      table.decimal('debit_amount', 15, 2).defaultTo(0);
      table.decimal('credit_amount', 15, 2).defaultTo(0);
      table.text('description');
      table.timestamps(true, true);
    })
    .createTable('cost_centers', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('code').notNullable();
      table.text('description');
      table.enum('type', ['breeding', 'feedlot', 'crops', 'dairy', 'general']).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.unique(['farm_id', 'code']);
    })
    .createTable('budgets', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('cost_center_id').references('id').inTable('cost_centers');
      table.string('name').notNullable();
      table.integer('budget_year').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.decimal('total_budgeted_income', 15, 2).defaultTo(0);
      table.decimal('total_budgeted_expenses', 15, 2).defaultTo(0);
      table.enum('status', ['draft', 'approved', 'active', 'completed']).defaultTo('draft');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('budget_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('budget_id').references('id').inTable('budgets').onDelete('CASCADE');
      table.uuid('account_id').references('id').inTable('accounts');
      table.string('item_name').notNullable();
      table.decimal('budgeted_amount', 15, 2).notNullable();
      table.decimal('actual_amount', 15, 2).defaultTo(0);
      table.decimal('variance_amount', 15, 2).defaultTo(0);
      table.decimal('variance_percentage', 5, 2).defaultTo(0);
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('invoices', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('invoice_number').unique().notNullable();
      table.enum('type', ['sales', 'purchase']).notNullable();
      table.string('customer_supplier_name').notNullable();
      table.json('customer_supplier_details');
      table.date('invoice_date').notNullable();
      table.date('due_date');
      table.decimal('subtotal', 15, 2).notNullable();
      table.decimal('tax_amount', 15, 2).defaultTo(0);
      table.decimal('total_amount', 15, 2).notNullable();
      table.decimal('paid_amount', 15, 2).defaultTo(0);
      table.decimal('outstanding_amount', 15, 2).notNullable();
      table.enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).defaultTo('draft');
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('invoice_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
      table.string('item_description').notNullable();
      table.decimal('quantity', 12, 3).notNullable();
      table.string('unit');
      table.decimal('unit_price', 12, 2).notNullable();
      table.decimal('total_price', 15, 2).notNullable();
      table.decimal('tax_rate', 5, 2).defaultTo(0);
      table.decimal('tax_amount', 12, 2).defaultTo(0);
      table.timestamps(true, true);
    })
    .createTable('payments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('invoice_id').references('id').inTable('invoices');
      table.string('payment_number').unique().notNullable();
      table.date('payment_date').notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.enum('payment_method', ['cash', 'bank_transfer', 'check', 'credit_card', 'other']).notNullable();
      table.string('reference_number');
      table.text('notes');
      table.uuid('received_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('profitability_analysis', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('cost_center_id').references('id').inTable('cost_centers');
      table.string('analysis_period'); // monthly, quarterly, yearly
      table.date('period_start').notNullable();
      table.date('period_end').notNullable();
      table.decimal('total_revenue', 15, 2).defaultTo(0);
      table.decimal('total_costs', 15, 2).defaultTo(0);
      table.decimal('gross_profit', 15, 2).defaultTo(0);
      table.decimal('net_profit', 15, 2).defaultTo(0);
      table.decimal('profit_margin_percentage', 5, 2).defaultTo(0);
      table.decimal('roi_percentage', 5, 2).defaultTo(0);
      table.json('detailed_breakdown');
      table.uuid('calculated_by').references('id').inTable('users');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('profitability_analysis')
    .dropTableIfExists('payments')
    .dropTableIfExists('invoice_items')
    .dropTableIfExists('invoices')
    .dropTableIfExists('budget_items')
    .dropTableIfExists('budgets')
    .dropTableIfExists('cost_centers')
    .dropTableIfExists('transaction_entries')
    .dropTableIfExists('transactions')
    .dropTableIfExists('accounts')
    .dropTableIfExists('account_categories');
};