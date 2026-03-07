export async function up(knex) {
	// --- fcm_config table (singleton) ---
	if (!(await knex.schema.hasTable('fcm_config'))) {
		await knex.schema.createTable('fcm_config', (table) => {
			table.increments('id').unsigned().notNullable().primary();
			table.json('firebase_config').nullable();
			table.json('service_account').nullable();
			table.string('vapid_key', 255).nullable();
			table.string('notification_icon', 255).nullable();
			table.string('notification_tag', 255).nullable();
			table.boolean('group_notifications').defaultTo(true);
			table.boolean('group_by_collection').defaultTo(true);
		});
	}

	// --- fcm_tokens table ---
	if (!(await knex.schema.hasTable('fcm_tokens'))) {
		await knex.schema.createTable('fcm_tokens', (table) => {
			table.increments('id').unsigned().notNullable().primary();
			table.uuid('user').nullable();
			table.string('token', 255).nullable();
			table.string('device_name', 255).nullable();

			table.foreign('user').references('id').inTable('directus_users').onDelete('CASCADE');
		});
	}
}

export async function down(knex) {
	await knex.schema.dropTableIfExists('fcm_tokens');
	await knex.schema.dropTableIfExists('fcm_config');
}
