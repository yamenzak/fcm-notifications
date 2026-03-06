import { defineHook } from '@directus/extensions-sdk';
import { GoogleAuth } from 'google-auth-library';

export default defineHook(({ action }, { services }) => {
	const { ItemsService } = services;

	action('notifications.create', async (p, { schema }) => {
		console.log('FCM Hook: Processing notification...');
		const { recipient, subject, message } = p.payload;
		
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
			console.log(`FCM Hook: Sending to ${tokens.length} tokens for user ${recipient}`);
			
			if (tokens.length === 0) return;

			const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
			for (const fcmToken of tokens) {
				fetch(fcmUrl, {
					method: 'POST',
					headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						message: { 
							token: fcmToken, 
							// We move the content to 'data' and OMIT 'notification' 
							// to prevent the browser/OS from double-showing it.
							data: { 
								title: subject || 'New Notification', 
								body: message || 'You have a new message' 
							} 
						} 
					}),
				});
			}
		} catch (e) { console.error('FCM Hook Error:', e); }
	});
});
