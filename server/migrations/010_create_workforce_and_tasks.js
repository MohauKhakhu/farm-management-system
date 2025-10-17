exports.up = function(knex) {
  return knex.schema
    .createTable('departments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description');
      table.uuid('manager_id').references('id').inTable('users');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('job_positions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('department_id').references('id').inTable('departments').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('description');
      table.json('responsibilities');
      table.json('required_skills');
      table.decimal('base_salary', 10, 2);
      table.string('salary_period'); // hourly, daily, weekly, monthly
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('employees', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('position_id').references('id').inTable('job_positions');
      table.string('employee_number').unique().notNullable();
      table.date('hire_date').notNullable();
      table.date('termination_date');
      table.enum('employment_type', ['full_time', 'part_time', 'contract', 'seasonal']).defaultTo('full_time');
      table.enum('status', ['active', 'inactive', 'terminated', 'on_leave']).defaultTo('active');
      table.decimal('current_salary', 10, 2);
      table.string('salary_period');
      table.json('emergency_contact');
      table.json('certifications');
      table.timestamps(true, true);
    })
    .createTable('work_schedules', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
      table.string('schedule_name');
      table.enum('schedule_type', ['fixed', 'rotating', 'flexible']).defaultTo('fixed');
      table.json('weekly_schedule'); // days and hours
      table.date('effective_from');
      table.date('effective_to');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('time_tracking', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
      table.date('work_date').notNullable();
      table.time('clock_in_time');
      table.time('clock_out_time');
      table.time('break_start_time');
      table.time('break_end_time');
      table.decimal('regular_hours', 5, 2).defaultTo(0);
      table.decimal('overtime_hours', 5, 2).defaultTo(0);
      table.enum('status', ['present', 'absent', 'late', 'half_day', 'sick_leave', 'vacation']).defaultTo('present');
      table.text('notes');
      table.uuid('approved_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('task_categories', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.string('category_type'); // daily, maintenance, project, emergency
      table.timestamps(true, true);
    })
    .createTable('tasks', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.uuid('category_id').references('id').inTable('task_categories');
      table.string('title').notNullable();
      table.text('description').notNullable();
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
      table.date('due_date');
      table.datetime('start_time');
      table.datetime('end_time');
      table.decimal('estimated_hours', 5, 2);
      table.decimal('actual_hours', 5, 2);
      table.string('location');
      table.json('required_equipment');
      table.json('required_materials');
      table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).defaultTo('pending');
      table.uuid('created_by').references('id').inTable('users');
      table.uuid('assigned_to').references('id').inTable('employees');
      table.uuid('completed_by').references('id').inTable('employees');
      table.datetime('completed_at');
      table.text('completion_notes');
      table.integer('quality_rating'); // 1-5 scale
      table.timestamps(true, true);
    })
    .createTable('task_assignments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
      table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
      table.datetime('assigned_at').notNullable();
      table.uuid('assigned_by').references('id').inTable('users');
      table.boolean('is_primary_assignee').defaultTo(false);
      table.text('assignment_notes');
      table.timestamps(true, true);
    })
    .createTable('training_programs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('program_name').notNullable();
      table.text('description');
      table.string('category'); // safety, technical, compliance, etc.
      table.integer('duration_hours');
      table.boolean('is_mandatory').defaultTo(false);
      table.date('valid_from');
      table.date('valid_to');
      table.integer('renewal_period_months');
      table.json('learning_objectives');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('employee_training', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
      table.uuid('program_id').references('id').inTable('training_programs').onDelete('CASCADE');
      table.date('enrollment_date');
      table.date('completion_date');
      table.date('expiry_date');
      table.enum('status', ['enrolled', 'in_progress', 'completed', 'expired', 'failed']).defaultTo('enrolled');
      table.integer('score_percentage');
      table.string('certificate_number');
      table.text('notes');
      table.uuid('trainer_id').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('payroll_periods', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
      table.string('period_name').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.date('pay_date');
      table.enum('status', ['open', 'calculated', 'approved', 'paid']).defaultTo('open');
      table.decimal('total_gross_pay', 15, 2).defaultTo(0);
      table.decimal('total_deductions', 15, 2).defaultTo(0);
      table.decimal('total_net_pay', 15, 2).defaultTo(0);
      table.uuid('processed_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    .createTable('payroll_entries', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('period_id').references('id').inTable('payroll_periods').onDelete('CASCADE');
      table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
      table.decimal('regular_hours', 5, 2).defaultTo(0);
      table.decimal('overtime_hours', 5, 2).defaultTo(0);
      table.decimal('regular_pay', 10, 2).defaultTo(0);
      table.decimal('overtime_pay', 10, 2).defaultTo(0);
      table.decimal('bonus', 10, 2).defaultTo(0);
      table.decimal('gross_pay', 10, 2).defaultTo(0);
      table.decimal('tax_deduction', 10, 2).defaultTo(0);
      table.decimal('other_deductions', 10, 2).defaultTo(0);
      table.decimal('net_pay', 10, 2).defaultTo(0);
      table.json('deduction_breakdown');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payroll_entries')
    .dropTableIfExists('payroll_periods')
    .dropTableIfExists('employee_training')
    .dropTableIfExists('training_programs')
    .dropTableIfExists('task_assignments')
    .dropTableIfExists('tasks')
    .dropTableIfExists('task_categories')
    .dropTableIfExists('time_tracking')
    .dropTableIfExists('work_schedules')
    .dropTableIfExists('employees')
    .dropTableIfExists('job_positions')
    .dropTableIfExists('departments');
};