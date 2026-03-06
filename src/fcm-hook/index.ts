import { defineHook } from '@directus/extensions-sdk';
import { GoogleAuth } from 'google-auth-library';
import { Readable } from 'stream';

const streamToString = (s: Readable): Promise<string> => {
	const c: any[] = [];
	return new Promise((r, j) => {
		s.on('data', (chunk) => c.push(Buffer.from(chunk)));
		s.on('error', (e) => j(e));
		s.on('end', () => r(Buffer.concat(c).toString('utf8')));
	});
};

export default defineHook(({ action }, { services }) => {
	const { ItemsService, FilesService } = services;

	action('notifications.items.create', async (p, { schema }) => {
		const { recipient, subject, message } = p.payload;
		try {
			const configService = new ItemsService('fcm_config', { schema, accountability: { admin: true } });
			const config = await configService.readSingleton({});
			if (!config?.service_account) return;

			const filesService = new FilesService({ schema, accountability: { admin: true } });
			const sStr = await streamToString(await filesService.read(config.service_account));
			const sa = JSON.parse(sStr);

			const auth = new GoogleAuth({ credentials: sa, scopes: 'https://www.googleapis.com/auth/firebase.messaging' });
			const client = await auth.getClient();
			const token = await client.getAccessToken();

			const tService = new ItemsService('fcm_tokens', { schema, accountability: { admin: true } });
			const tRes = await tService.readByQuery({ filter: { user: { _in: Array.isArray(recipient) ? recipient : [recipient] } } });
			const tokens = tRes.map((t: any) => t.token);
			if (tokens.length === 0) return;

			const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
			for (const fcmToken of tokens) {
				fetch(fcmUrl, {
					method: 'POST',
					headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: { token: fcmToken, notification: { title: subject || 'New Notification', body: message || 'You have a new message' } } }),
				}).then(async (res) => {
					if (!res.ok) {
						const err = await res.json();
						if (err.error?.status === 'INVALID_ARGUMENT' || err.error?.status === 'NOT_FOUND') await tService.deleteByQuery({ filter: { token: { _eq: fcmToken } } });
					}
				});
			}
		} catch (e) { console.error('FCM Hook Action Error:', e); }
	});
});
