import { defineOperationApi } from '@directus/extensions-sdk';
import { GoogleAuth } from 'google-auth-library';

export default defineOperationApi({
	id: 'fcm-broadcast',
	handler: async ({ recipient, subject, message }, { services, schema }: any) => {
		const { ItemsService } = services;
		try {
			const configService = new ItemsService('fcm_config', { schema, accountability: { admin: true } as any });
			const config = await configService.readSingleton({});
			const sa: any = (config as any)?.service_account;
			if (!sa?.project_id) throw new Error('Service account missing.');

			const auth = new GoogleAuth({ credentials: sa, scopes: 'https://www.googleapis.com/auth/firebase.messaging' });
			const client = await auth.getClient();
			const token = await client.getAccessToken();

			const tService = new ItemsService('fcm_tokens', { schema, accountability: { admin: true } as any });
			const targetRecipients = Array.isArray(recipient) ? recipient : [recipient];
			const tRes = await tService.readByQuery({ filter: { user: { _in: targetRecipients } } });
			const tokens = (tRes as any[]).map((t: any) => t.token);
			
			if (tokens.length === 0) return { success: true, sent: 0 };

			const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
			let successCount = 0;

			for (const fcmToken of tokens) {
				const res = await fetch(fcmUrl, {
					method: 'POST',
					headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: { token: fcmToken, notification: { title: subject || 'New Notification', body: message || 'You have a new message' } } }),
				});
				if (res.ok) successCount++;
			}
			return { success: true, sent: successCount };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	},
});
