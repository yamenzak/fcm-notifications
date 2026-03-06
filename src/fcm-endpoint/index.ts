import { defineEndpoint } from '@directus/extensions-sdk';

let isSetup = false;
let cachedFirebaseCode = '';

async function getFirebaseCode() {
	if (cachedFirebaseCode) return cachedFirebaseCode;
	try {
		const [appRes, messRes] = await Promise.all([
			fetch('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js'),
			fetch('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')
		]);
		const appCode = await appRes.text();
		const messCode = await messRes.text();
		cachedFirebaseCode = appCode + '\n' + messCode;
		return cachedFirebaseCode;
	} catch (e) {
		console.error('FCM: Failed to fetch Firebase code:', e);
		return '';
	}
}

async function ensureField(fs: any, collection: string, field: string, payload: any) {
	try { await fs.readOne(collection, field); } catch (e) { await fs.createField(collection, { field, ...payload }); }
}

async function runSetup(services: any, schema: any) {
	if (isSetup) return;
	const { CollectionsService, FieldsService, RelationsService } = services;
	const cs = new CollectionsService({ schema, accountability: { admin: true } });
	const fs = new FieldsService({ schema, accountability: { admin: true } });
	const rs = new RelationsService({ schema, accountability: { admin: true } });

	try {
		await cs.readOne('fcm_config').catch(async () => {
			await cs.createOne({ collection: 'fcm_config', singleton: true, meta: { icon: 'notifications_active', display_name: 'FCM Settings' }, schema: {} });
		});
		await cs.readOne('fcm_tokens').catch(async () => {
			await cs.createOne({ collection: 'fcm_tokens', meta: { icon: 'devices' }, schema: {} });
		});

		await ensureField(fs, 'fcm_config', 'firebase_config', { type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
		await ensureField(fs, 'fcm_config', 'service_account', { type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
		await ensureField(fs, 'fcm_config', 'vapid_key', { type: 'string', meta: { interface: 'input' } });

		await ensureField(fs, 'fcm_tokens', 'user', { type: 'uuid', meta: { interface: 'select-dropdown-m2o' }, schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' } });
		await ensureField(fs, 'fcm_tokens', 'token', { type: 'string', meta: { interface: 'input' } });
		await ensureField(fs, 'fcm_tokens', 'device_name', { type: 'string', meta: { interface: 'input' } });

		// Ensure relation
		try { await rs.readOne('fcm_tokens', 'user'); } catch (e) {
			await rs.createOne({ collection: 'fcm_tokens', field: 'user', related_collection: 'directus_users', schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' } });
		}

		isSetup = true;
	} catch (e) { console.error('FCM Setup Error:', e); }
}

export default defineEndpoint((router, { services, exceptions }) => {
	const { ItemsService } = services;

	router.post('/register', async (req, res, next) => {
		try {
			await runSetup(services, req.schema);
			if (!req.accountability?.user) throw new exceptions.AuthenticationException();
			const { token, device_name } = req.body;
			if (!token) return res.status(400).send('Token is required');
			const tokenService = new ItemsService('fcm_tokens', { schema: req.schema, accountability: req.accountability });
			const existing = await tokenService.readByQuery({ filter: { _and: [{ user: { _eq: req.accountability.user } }, { token: { _eq: token } }] } });
			if (existing.length === 0) await tokenService.createOne({ user: req.accountability.user, token, device_name: device_name || 'Web Browser' });
			return res.json({ success: true });
		} catch (error) { return next(error); }
	});

	router.get('/sw.js', async (req, res, next) => {
		try {
			const configService = new ItemsService('fcm_config', { schema: req.schema, accountability: { admin: true } });
			const config = await configService.readSingleton({});
			const firebaseLibCode = await getFirebaseCode();
			const swCode = `${firebaseLibCode}\nfirebase.initializeApp(${JSON.stringify(config.firebase_config)});const messaging = firebase.messaging();messaging.onBackgroundMessage((p) => { self.registration.showNotification(p.notification.title || 'New Notification', { body: p.notification.body || 'You have a new message', icon: '/assets/logo.png' }); });`;
			res.setHeader('Content-Type', 'application/javascript');
			return res.send(swCode);
		} catch (error) { return next(error); }
	});
});
