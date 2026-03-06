import { defineEndpoint } from '@directus/extensions-sdk';

interface FCMConfig {
	firebase_config: any;
	service_account: any;
	vapid_key: string;
	notification_icon?: string;
	notification_tag?: string;
	group_notifications?: boolean;
	group_by_collection?: boolean;
}

let isSetup = false;
let cachedFirebaseCode = '';

async function getFirebaseCode(): Promise<string> {
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
	} catch (error) {
		console.error('FCM: Failed to fetch Firebase code:', error);
		return '';
	}
}

async function getImageAsBase64(url: string | undefined): Promise<string> {
	if (!url || !url.startsWith('http')) return url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
	try {
		const res = await fetch(url, { signal: (AbortSignal as any).timeout(5000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const arrayBuffer = await res.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const contentType = res.headers.get('content-type') || 'image/png';
		return `data:${contentType};base64,${buffer.toString('base64')}`;
	} catch (error) {
		return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
	}
}

async function runSetup(services: any, schema: any): Promise<void> {
	if (isSetup) return;
	const { CollectionsService, FieldsService, RelationsService } = services;
	const cs = new CollectionsService({ schema, accountability: { admin: true } as any });
	const fs = new FieldsService({ schema, accountability: { admin: true } as any });
	const rs = new RelationsService({ schema, accountability: { admin: true } as any });

	try {
		await cs.readOne('fcm_config').catch(async () => {
			await cs.createOne({ collection: 'fcm_config', singleton: true, meta: { icon: 'notifications_active', display_name: 'FCM Settings' }, schema: {} });
		});
		
		const ensureField = async (col: string, field: string, payload: any) => {
			try { await fs.readOne(col, field); } catch (e) { await fs.createField(col, { field, ...payload }); }
		};

		await ensureField('fcm_config', 'firebase_config', { type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
		await ensureField('fcm_config', 'service_account', { type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } });
		await ensureField('fcm_config', 'vapid_key', { type: 'string', meta: { interface: 'input' } });
		await ensureField('fcm_config', 'notification_icon', { type: 'string', meta: { interface: 'input' } });
		await ensureField('fcm_config', 'notification_tag', { type: 'string', meta: { interface: 'input' } });
		await ensureField('fcm_config', 'group_notifications', { type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } });
		await ensureField('fcm_config', 'group_by_collection', { type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } });

		await ensureField('fcm_tokens', 'user', { type: 'uuid', meta: { interface: 'select-dropdown-m2o' }, schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' } });
		await ensureField('fcm_tokens', 'token', { type: 'string', meta: { interface: 'input' } });
		await ensureField('fcm_tokens', 'device_name', { type: 'string', meta: { interface: 'input' } });

		try { await rs.readOne('fcm_tokens', 'user'); } catch (e) {
			await rs.createOne({ collection: 'fcm_tokens', field: 'user', related_collection: 'directus_users', schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' } });
		}
		isSetup = true;
	} catch (error) {
		console.error('FCM Setup Error:', error);
	}
}

export default defineEndpoint((router, { services, exceptions }: any) => {
	const { ItemsService } = services;
	
	router.post('/register', async (req: any, res, next) => {
		try {
			await runSetup(services, req.schema);
			if (!req.accountability?.user) throw new exceptions.AuthenticationException();
			const { token, device_name } = req.body;
			const tokenService = new ItemsService('fcm_tokens', { schema: req.schema, accountability: req.accountability });
			const existing = await tokenService.readByQuery({ filter: { _and: [{ user: { _eq: req.accountability.user } }, { token: { _eq: token } }] } });
			if (existing.length === 0) await tokenService.createOne({ user: req.accountability.user, token, device_name: device_name || 'Web Browser' });
			return res.json({ success: true });
		} catch (error) { return next(error); }
	});

	router.get('/d1r3ctu5fcm.js', async (req: any, res, next) => {
		try {
			const configService = new ItemsService('fcm_config', { schema: req.schema, accountability: { admin: true } as any });
			const config = await configService.readSingleton({}) as FCMConfig;
			const firebaseLibCode = await getFirebaseCode();
			const icon = await getImageAsBase64(config.notification_icon);
			const swCode = `${firebaseLibCode}\nfirebase.initializeApp(${JSON.stringify(config.firebase_config)});const messaging = firebase.messaging();messaging.onBackgroundMessage((p) => { const title = p.data?.title || 'New Notification'; const options = { body: p.data?.body || 'You have a message', icon: '${icon}', tag: p.data?.tag || 'directus-notif', renotify: true }; self.registration.showNotification(title, options); });`;
			res.setHeader('Content-Type', 'application/javascript');
			res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
			return res.send(swCode);
		} catch (error) { return next(error); }
	});
});
