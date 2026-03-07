export async function up(knex) {
	// Fix: change user column from char(36) to uuid if needed, and add foreign key
	const hasTable = await knex.schema.hasTable('fcm_tokens');
	if (!hasTable) return;

	const hasForeignKey = await knex.raw(`
		SELECT 1 FROM information_schema.table_constraints
		WHERE constraint_name = 'fcm_tokens_user_foreign'
		AND table_name = 'fcm_tokens'
	`);

	if (hasForeignKey.rows.length === 0) {
		await knex.schema.alterTable('fcm_tokens', (table) => {
			table.uuid('user_new').nullable();
		});

		await knex.raw('UPDATE fcm_tokens SET user_new = user::uuid WHERE user IS NOT NULL');

		await knex.schema.alterTable('fcm_tokens', (table) => {
			table.dropColumn('user');
		});

		await knex.schema.alterTable('fcm_tokens', (table) => {
			table.renameColumn('user_new', 'user');
		});

		await knex.schema.alterTable('fcm_tokens', (table) => {
			table.foreign('user').references('id').inTable('directus_users').onDelete('CASCADE');
		});
	}
}

export async function down(knex) {
	// no-op
}
