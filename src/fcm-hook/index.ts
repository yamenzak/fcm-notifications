import { defineHook } from '@directus/extensions-sdk';
import { GoogleAuth } from 'google-auth-library';

interface FCMConfig {
	service_account: any;
	notification_tag?: string;
	group_notifications?: boolean;
	group_by_collection?: boolean;
}

export default defineHook(({ action, init }, { services, getSchema }) => {
	const { ItemsService, CollectionsService, FieldsService, RelationsService } = services;

	init('app.after', async () => {
		const schema = await getSchema();
		const cs = new CollectionsService({ schema, accountability: { admin: true } as any });
		const fs = new FieldsService({ schema, accountability: { admin: true } as any });
		const rs = new RelationsService({ schema, accountability: { admin: true } as any });

		const ensureField = async (col: string, field: string, payload: any) => {
			try { await fs.readOne(col, field); } catch (e) { await fs.createField(col, { field, ...payload }); }
		};

		try {
			await cs.readOne('fcm_config').catch(async () => {
				await cs.createOne({ 
					collection: 'fcm_config', 
					singleton: true, 
					meta: { icon: 'notifications_active', display_name: 'FCM Settings', group: null }, 
					schema: {} 
				});
			});

			await ensureField('fcm_config', 'firebase_config', { type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
			await ensureField('fcm_config', 'service_account', { type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
			await ensureField('fcm_config', 'vapid_key', { type: 'string', meta: { interface: 'input' } });
			await ensureField('fcm_config', 'notification_icon', { type: 'string', meta: { interface: 'input' } });
			await ensureField('fcm_config', 'notification_tag', { type: 'string', meta: { interface: 'input' } });
			await ensureField('fcm_config', 'group_notifications', { type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } });
			await ensureField('fcm_config', 'group_by_collection', { type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } });

			// Ensure fcm_tokens
			await cs.readOne('fcm_tokens').catch(async () => {
				await cs.createOne({ 
					collection: 'fcm_tokens', 
					meta: { icon: 'phonelink_ring', display_name: 'FCM Tokens', hidden: true }, 
					schema: {} 
				});
			});

			await ensureField('fcm_tokens', 'user', { type: 'uuid', meta: { interface: 'select-dropdown-m2o' }, schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' } });
			await ensureField('fcm_tokens', 'token', { type: 'string', meta: { interface: 'input' } });
			await ensureField('fcm_tokens', 'device_name', { type: 'string', meta: { interface: 'input' } });

			try { await rs.readOne('fcm_tokens', 'user'); } catch (e) {
				await rs.createOne({ 
					collection: 'fcm_tokens', 
					field: 'user', 
					related_collection: 'directus_users', 
					schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' } 
				});
			}
		} catch (error) {
			console.error('FCM Hook Init Error:', error);
		}
	});

	action('notifications.create', async (p: any, { schema }: any) => {
		const { recipient, subject, message, collection } = p.payload;
		
		try {
			const configService = new ItemsService('fcm_config', { schema, accountability: { admin: true } as any });
			const config = await configService.readSingleton({}) as FCMConfig;
			const sa = config?.service_account;
			if (!sa || !sa.project_id) return;

			const auth = new GoogleAuth({
				credentials: sa,
				scopes: 'https://www.googleapis.com/auth/firebase.messaging',
			});
			const client = await auth.getClient();
			const token = await client.getAccessToken();

			const tService = new ItemsService('fcm_tokens', { schema, accountability: { admin: true } as any });
			const targetRecipients = Array.isArray(recipient) ? recipient : [recipient];
			const tRes = await tService.readByQuery({ filter: { user: { _in: targetRecipients } } });
			const tokens = tRes.map((t: any) => t.token);
			
			if (tokens.length === 0) return;

			let tag: string | undefined = undefined;
			if (config.group_notifications) {
				if (config.group_by_collection && collection) {
					tag = collection;
				} else {
					tag = config.notification_tag || 'directus-notif';
				}
			}

			const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
			for (const fcmToken of tokens) {
				fetch(fcmUrl, {
					method: 'POST',
					headers: { 
						'Authorization': `Bearer ${token.token}`, 
						'Content-Type': 'application/json' 
					},
					body: JSON.stringify({ 
						message: { 
							token: fcmToken, 
							data: { 
								title: subject || 'New Notification', 
								body: message || 'You have a new message',
								tag: tag 
							} 
						} 
					}),
				}).catch((error) => {
					console.error('FCM: Fetch failed for token:', error);
				});
			}
		} catch (error) { 
			console.error('FCM Hook Error:', error); 
		}
	});
});
