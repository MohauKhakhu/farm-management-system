exports.up = function(knex) {
  return knex.schema
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone');
      table.enum('role', ['admin', 'manager', 'worker', 'viewer']).defaultTo('worker');
      table.json('permissions');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login');
      table.timestamps(true, true);
    })
    .createTable('user_sessions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('token').unique().notNullable();
      table.timestamp('expires_at').notNullable();
      table.string('ip_address');
      table.string('user_agent');
      table.timestamps(true, true);
    })
    .createTable('farms', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.string('location');
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.decimal('total_area');
      table.string('area_unit').defaultTo('hectares');
      table.uuid('owner_id').references('id').inTable('users');
      table.json('contact_info');
      table.timestamps(true, true);
    })
    .createTable('farm_users', table => {
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.enum('role', ['owner', 'manager', 'worker', 'viewer']).defaultTo('worker');
      table.timestamps(true, true);
      table.primary(['farm_id', 'user_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('farm_users')
    .dropTableIfExists('farms')
    .dropTableIfExists('user_sessions')
    .dropTableIfExists('users');
};