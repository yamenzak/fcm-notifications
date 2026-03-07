const COLLECTION_INSERTS = [
	{
		collection: 'fcm_config',
		icon: 'notifications_active',
		note: null,
		display_template: null,
		hidden: false,
		singleton: true,
		translations: JSON.stringify([
			{ language: 'en-US', translation: 'FCM Settings' },
		]),
		archive_field: null,
		archive_app_filter: false,
		archive_value: null,
		unarchive_value: null,
		sort_field: null,
		accountability: null,
		color: null,
		item_duplication_fields: null,
		sort: null,
		group: null,
		collapse: 'open',
		preview_url: null,
		versioning: false,
	},
	{
		collection: 'fcm_tokens',
		icon: 'phonelink_ring',
		note: null,
		display_template: null,
		hidden: true,
		singleton: false,
		translations: JSON.stringify([
			{ language: 'en-US', translation: 'FCM Tokens' },
		]),
		archive_field: null,
		archive_app_filter: false,
		archive_value: null,
		unarchive_value: null,
		sort_field: null,
		accountability: null,
		color: null,
		item_duplication_fields: null,
		sort: null,
		group: null,
		collapse: 'open',
		preview_url: null,
		versioning: false,
	},
];

const FIELD_INSERTS = [
	// --- fcm_config fields ---
	{
		collection: 'fcm_config',
		field: 'id',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: true,
		hidden: true,
		sort: 1,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'firebase_config',
		special: 'cast-json',
		interface: 'input-code',
		options: JSON.stringify({ language: 'json' }),
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 2,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'service_account',
		special: 'cast-json',
		interface: 'input-code',
		options: JSON.stringify({ language: 'json' }),
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 3,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'vapid_key',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 4,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'notification_icon',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 5,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'notification_tag',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 6,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'group_notifications',
		special: 'cast-boolean',
		interface: 'boolean',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 7,
		width: 'half',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_config',
		field: 'group_by_collection',
		special: 'cast-boolean',
		interface: 'boolean',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 8,
		width: 'half',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	// --- fcm_tokens fields ---
	{
		collection: 'fcm_tokens',
		field: 'id',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: true,
		hidden: true,
		sort: 1,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_tokens',
		field: 'user',
		special: 'm2o',
		interface: 'select-dropdown-m2o',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 2,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_tokens',
		field: 'token',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 3,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
	{
		collection: 'fcm_tokens',
		field: 'device_name',
		special: null,
		interface: 'input',
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: 4,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
	},
];

const RELATION_INSERTS = [
	{
		many_collection: 'fcm_tokens',
		many_field: 'user',
		one_collection: 'directus_users',
		one_field: null,
		one_collection_field: null,
		one_allowed_collections: null,
		junction_field: null,
		sort_field: null,
		one_deselect_action: 'nullify',
	},
];

export async function up(knex) {
	const configExists = await knex('directus_collections')
		.select('collection')
		.where('collection', 'fcm_config')
		.first();

	if (!configExists) {
		await knex('directus_collections').insert(
			COLLECTION_INSERTS.filter((c) => c.collection === 'fcm_config'),
		);
	}

	const tokensExists = await knex('directus_collections')
		.select('collection')
		.where('collection', 'fcm_tokens')
		.first();

	if (!tokensExists) {
		await knex('directus_collections').insert(
			COLLECTION_INSERTS.filter((c) => c.collection === 'fcm_tokens'),
		);
	}

	// Insert fields (skip any that already exist)
	for (const field of FIELD_INSERTS) {
		const exists = await knex('directus_fields')
			.where({ collection: field.collection, field: field.field })
			.first();

		if (!exists) {
			await knex('directus_fields').insert(field);
		}
	}

	// Insert relations
	for (const relation of RELATION_INSERTS) {
		const exists = await knex('directus_relations')
			.where({
				many_collection: relation.many_collection,
				many_field: relation.many_field,
			})
			.first();

		if (!exists) {
			await knex('directus_relations').insert(relation);
		}
	}
}

export async function down(knex) {
	await knex('directus_relations')
		.where('many_collection', 'fcm_tokens')
		.del();
	await knex('directus_fields').where('collection', 'fcm_config').del();
	await knex('directus_fields').where('collection', 'fcm_tokens').del();
	await knex('directus_collections').where('collection', 'fcm_config').del();
	await knex('directus_collections').where('collection', 'fcm_tokens').del();
}
