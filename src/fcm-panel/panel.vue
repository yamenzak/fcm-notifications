<template>
	<div class="fcm-panel-container">
		<v-info v-if="error" type="danger" icon="error" class="mb-4">{{ error }}</v-info>
		<v-info v-if="status" type="success" icon="check" class="mb-4">{{ status }}</v-info>
		
		<div v-if="checking" class="checking">
			<v-progress-circular indeterminate />
			<p>Checking status...</p>
		</div>

		<div v-else-if="!status && !error">
			<div v-if="isIOS && !isStandalone" class="ios-prompt">
				<v-icon name="ios_share" size="large" class="panel-icon warning" />
				<h3>Action Required</h3>
				<p>To enable notifications on iPhone, tap the <strong>Share</strong> button and select <strong>"Add to Home Screen"</strong>.</p>
				<v-info type="warning" icon="info">iOS only supports notifications when saved as an App.</v-info>
			</div>

			<div v-else>
				<v-icon name="notifications" size="large" class="panel-icon" :class="{ active: subscribed }" />
				<h3>{{ subscribed ? 'Notifications Enabled' : 'Push Notifications' }}</h3>
				<p>{{ subscribed ? 'You are receiving notifications on this device.' : 'Stay updated with real-time notifications.' }}</p>
				
				<v-button v-if="!subscribed" @click="requestPermission" :loading="loading" kind="primary">
					Enable Notifications
				</v-button>
				
				<v-button v-else @click="unsubscribe" :loading="loading" kind="secondary" secondary>
					Disable on this Device
				</v-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken, Messaging } from 'firebase/messaging';

interface FCMConfig {
	firebase_config: any;
	vapid_key: string;
}

const api = useApi();
const loading = ref(false);
const checking = ref(true);
const subscribed = ref(false);
const status = ref('');
const error = ref('');
let currentToken = '';

const isIOS = computed(() => {
	return ['iPad Simulator','iPhone Simulator','iPod Simulator','iPad','iPhone','iPod'].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
});

const isStandalone = computed(() => {
	return (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
});

const getFirebase = async (): Promise<{ app: FirebaseApp; vapidKey: string }> => {
	const res = await api.get('/fcm/config');
	const config = res.data as FCMConfig;
	if (!config?.firebase_config) throw new Error('Firebase configuration missing.');
	const app = !getApps().length ? initializeApp(config.firebase_config) : getApp();
	return { app, vapidKey: config.vapid_key };
};

const checkSubscription = async () => {
	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (let reg of registrations) {
			if (reg.scope.includes('/fcm/') && !reg.active?.scriptURL.includes('d1r3ctu5fcm.js')) {
				await reg.unregister();
			}
		}

		if (isIOS.value && !isStandalone.value) return;
		if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

		const registration = await navigator.serviceWorker.getRegistration('/fcm/');
		if (!registration) return;

		const { app, vapidKey } = await getFirebase();
		const messaging: Messaging = getMessaging(app);
		const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

		if (token) {
			currentToken = token;
			const res = await api.post('/fcm/register', { token, device_name: 'Checking...' });
			subscribed.value = res.data.success;
		}
	} catch (err) {
	} finally {
		checking.value = false;
	}
};

const requestPermission = async () => {
	loading.value = true;
	error.value = '';
	try {
		const { app, vapidKey } = await getFirebase();
		const messaging: Messaging = getMessaging(app);
		if (typeof Notification === 'undefined') throw new Error('Not supported.');

		const permission = await Notification.requestPermission();
		if (permission !== 'granted') throw new Error('Permission denied.');

		const registration = await navigator.serviceWorker.register('/fcm/d1r3ctu5fcm.js', { scope: '/fcm/' });
		const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
		if (!token) throw new Error('Failed.');

		await api.post('/fcm/register', { token, device_name: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Web' });
		
		currentToken = token;
		subscribed.value = true;
		status.value = 'Enabled!';
		setTimeout(() => status.value = '', 3000);
	} catch (err: any) {
		error.value = err.message || 'Error.';
		setTimeout(() => error.value = '', 5000);
	} finally {
		loading.value = false;
	}
};

const unsubscribe = async () => {
	loading.value = true;
	try {
		const { app } = await getFirebase();
		const messaging: Messaging = getMessaging(app);
		await api.post('/fcm/unregister', { token: currentToken });
		try { await deleteToken(messaging); } catch (e) {}
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (let reg of registrations) {
			if (reg.scope.includes('/fcm/')) await reg.unregister();
		}
		subscribed.value = false;
		status.value = 'Unsubscribed.';
		setTimeout(() => status.value = '', 3000);
	} catch (err: any) {
		error.value = 'Failed.';
		setTimeout(() => error.value = '', 5000);
	} finally {
		loading.value = false;
	}
};

onMounted(() => { checkSubscription(); });
</script>

<style scoped>
.fcm-panel-container { padding: 32px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; }
.panel-icon { margin-bottom: 16px; color: var(--foreground-subdued); transition: color 0.3s ease; }
.panel-icon.active { color: var(--primary); }
.panel-icon.warning { color: var(--warning); }
.mb-4 { margin-bottom: 16px; }
.checking { color: var(--foreground-subdued); }
h3 { margin-bottom: 8px; }
p { margin-bottom: 24px; color: var(--foreground-subdued); max-width: 300px; }
</style>
