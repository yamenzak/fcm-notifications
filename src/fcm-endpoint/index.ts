import { defineEndpoint } from '@directus/extensions-sdk';

let isSetup = false;

async function runSetup(services: any, schema: any) {
	if (isSetup) return;
	const { CollectionsService, FieldsService } = services;
	const cs = new CollectionsService({ schema, accountability: { admin: true } });
	const fs = new FieldsService({ schema, accountability: { admin: true } });
	try {
		await cs.readOne('fcm_config').catch(async () => {
			await cs.createOne({ collection: 'fcm_config', singleton: true, meta: { icon: 'settings_input_component' }, schema: {} });
			await fs.createField('fcm_config', { field: 'firebase_config', type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
			await fs.createField('fcm_config', { field: 'service_account', type: 'uuid', meta: { interface: 'file' } });
			await fs.createField('fcm_config', { field: 'vapid_key', type: 'string', meta: { interface: 'input' } });
		});
		await cs.readOne('fcm_tokens').catch(async () => {
			await cs.createOne({ collection: 'fcm_tokens', meta: { icon: 'devices' }, schema: {} });
			await fs.createField('fcm_tokens', { field: 'user', type: 'uuid', meta: { interface: 'select-dropdown-m2o' }, schema: { foreign_key_column: 'id', foreign_key_table: 'directus_users' } });
			await fs.createField('fcm_tokens', { field: 'token', type: 'string', meta: { interface: 'input' } });
			await fs.createField('fcm_tokens', { field: 'device_name', type: 'string', meta: { interface: 'input' } });
		});
		isSetup = true;
	} catch (e) {}
}

export default defineEndpoint((router, { services, exceptions }) => {
	const { ItemsService } = services;

	router.post('/register', async (req, res, next) => {
		try {
			await runSetup(services, req.schema);
			if (!req.accountability?.user) {
				const { AuthenticationException } = exceptions;
				throw new AuthenticationException();
			}
			const { token, device_name } = req.body;
			if (!token) return res.status(400).send('Token is required');

			const tokenService = new ItemsService('fcm_tokens', { schema: req.schema, accountability: req.accountability });
			const existing = await tokenService.readByQuery({ filter: { _and: [{ user: { _eq: req.accountability.user } }, { token: { _eq: token } }] } });

			if (existing.length === 0) {
				await tokenService.createOne({ user: req.accountability.user, token, device_name: device_name || 'Web Browser' });
			}
			return res.json({ success: true });
		} catch (error) { return next(error); }
	});

	router.get('/sw.js', async (req, res, next) => {
		try {
			const configService = new ItemsService('fcm_config', { schema: req.schema, accountability: { admin: true } });
			const config = await configService.readSingleton({});
			const swCode = `
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config.firebase_config)});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((p) => {
  self.registration.showNotification(p.notification.title, { body: p.notification.body, icon: '/assets/logo.png' });
});`;
			res.setHeader('Content-Type', 'application/javascript');
			return res.send(swCode);
		} catch (error) { return next(error); }
	});
});
