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

let cachedFirebaseCode = '';

async function getFirebaseCode(): Promise<string> {
	if (cachedFirebaseCode) return cachedFirebaseCode;
	try {
		const [appRes, messRes] = await Promise.all([
			fetch('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js'),
			fetch('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')
		]);
		cachedFirebaseCode = (await appRes.text()) + '\n' + (await messRes.text());
		return cachedFirebaseCode;
	} catch (error) { return ''; }
}

async function getImageAsBase64(url: string | undefined): Promise<string> {
	if (!url || !url.startsWith('http')) return url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
	try {
		const res = await fetch(url, { signal: (AbortSignal as any).timeout(5000) });
		const arrayBuffer = await res.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const contentType = res.headers.get('content-type') || 'image/png';
		return `data:${contentType};base64,${buffer.toString('base64')}`;
	} catch (error) { return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }
}

export default defineEndpoint((router, { services, exceptions }: any) => {
	const { ItemsService } = services;
	
	// NEW: Safe Config Fetcher (Public parts only)
	router.get('/config', async (req: any, res, next) => {
		try {
			const configService = new ItemsService('fcm_config', { schema: req.schema, accountability: { admin: true } as any });
			const config = await configService.readSingleton({}) as FCMConfig;
			return res.json({
				firebase_config: config.firebase_config,
				vapid_key: config.vapid_key
			});
		} catch (error) { return next(error); }
	});

	router.post('/register', async (req: any, res, next) => {
		try {
			if (!req.accountability?.user) throw new exceptions.AuthenticationException();
			const { token, device_name } = req.body;
			const tokenService = new ItemsService('fcm_tokens', { schema: req.schema, accountability: { admin: true } as any });
			const existing = await tokenService.readByQuery({ filter: { _and: [{ user: { _eq: req.accountability.user } }, { token: { _eq: token } }] } });
			if (existing.length === 0) await tokenService.createOne({ user: req.accountability.user, token, device_name: device_name || 'Web Browser' });
			return res.json({ success: true });
		} catch (error) { return next(error); }
	});

	// NEW: Unregister via Endpoint
	router.post('/unregister', async (req: any, res, next) => {
		try {
			if (!req.accountability?.user) throw new exceptions.AuthenticationException();
			const { token } = req.body;
			const tokenService = new ItemsService('fcm_tokens', { schema: req.schema, accountability: { admin: true } as any });
			await tokenService.deleteByQuery({ filter: { _and: [{ user: { _eq: req.accountability.user } }, { token: { _eq: token } }] } });
			return res.json({ success: true });
		} catch (error) { return next(error); }
	});

	router.get('/d1r3ctu5fcm.js', async (req: any, res, next) => {
		try {
			const configService = new ItemsService('fcm_config', { schema: req.schema, accountability: { admin: true } as any });
			const config = await configService.readSingleton({}) as FCMConfig;
			const firebaseLibCode = await getFirebaseCode();
			const icon = await getImageAsBase64(config.notification_icon);
			const swCode = `${firebaseLibCode}
firebase.initializeApp(${JSON.stringify(config.firebase_config)});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((p) => {
	const title = p.data?.title || 'New Notification';
	const actions = [];
	if (p.data?.url || (p.data?.collection && p.data?.item)) {
		actions.push({ action: 'view', title: 'View' });
	}
	actions.push({ action: 'dismiss', title: 'Dismiss' });
	const options = {
		body: p.data?.body || 'You have a message',
		icon: '${icon}',
		tag: p.data?.tag || 'directus-notif',
		renotify: true,
		data: { url: p.data?.url, collection: p.data?.collection, item: p.data?.item },
		actions: actions
	};
	self.registration.showNotification(title, options);
});
self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	if (event.action === 'dismiss') return;
	const d = event.notification.data;
	let targetUrl;
	if (d?.url) {
		targetUrl = d.url;
	} else if (d?.collection && d?.item) {
		targetUrl = self.location.origin + '/admin/content/' + d.collection + '/' + d.item;
	} else {
		targetUrl = self.location.origin + '/admin';
	}
	event.waitUntil(clients.openWindow(targetUrl));
});`;
			res.setHeader('Content-Type', 'application/javascript');
			res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
			return res.send(swCode);
		} catch (error) { return next(error); }
	});
});
