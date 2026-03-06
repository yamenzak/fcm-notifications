import { defineHook } from '@directus/extensions-sdk';
import { GoogleAuth } from 'google-auth-library';

export default defineHook(({ action }, { services }) => {
	const { ItemsService } = services;

	action('notifications.create', async (p, { schema }) => {
		const { recipient, subject, message, collection } = p.payload;
		
		try {
			const configService = new ItemsService('fcm_config', { schema, accountability: { admin: true } });
			const config = await configService.readSingleton({});
			const sa = config?.service_account;
			if (!sa?.project_id) return;

			const auth = new GoogleAuth({ credentials: sa, scopes: 'https://www.googleapis.com/auth/firebase.messaging' });
			const client = await auth.getClient();
			const token = await client.getAccessToken();

			const tService = new ItemsService('fcm_tokens', { schema, accountability: { admin: true } });
			const targetRecipients = Array.isArray(recipient) ? recipient : [recipient];
			const tRes = await tService.readByQuery({ filter: { user: { _in: targetRecipients } } });
			const tokens = tRes.map((t: any) => t.token);
			
			if (tokens.length === 0) return;

			// Determine the tag based on settings
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
					headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						message: { 
							token: fcmToken, 
							data: { 
								title: subject || 'New Notification', 
								body: message || 'You have a new message',
								tag: tag // Will be undefined if grouping is disabled
							} 
						} 
					}),
				});
			}
		} catch (e) { console.error('FCM Hook Error:', e); }
	});
});
