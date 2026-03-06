<template>
	<div class="fcm-panel-container">
		<v-info v-if="error" type="danger" icon="error" class="mb-4">{{ error }}</v-info>
		<v-info v-if="status" type="success" icon="check" class="mb-4">{{ status }}</v-info>
		
		<div v-if="checking" class="checking">
			<v-progress-circular indeterminate />
			<p>Checking status...</p>
		</div>

		<div v-else-if="!status && !error">
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';

const api = useApi();
const loading = ref(false);
const checking = ref(true);
const subscribed = ref(false);
const status = ref('');
const error = ref('');
let currentToken = '';

const getFirebase = async () => {
	const res = await api.get('/items/fcm_config');
	const config = res.data.data;
	if (!config?.firebase_config) throw new Error('Firebase configuration missing.');
	const app = !getApps().length ? initializeApp(config.firebase_config) : getApp();
	return { firebase: app, vapidKey: config.vapid_key };
};

const checkSubscription = async () => {
	try {
		if (Notification.permission !== 'granted') {
			subscribed.value = false;
			return;
		}

		const registration = await navigator.serviceWorker.getRegistration('/fcm/');
		if (!registration) return;

		const { firebase, vapidKey } = await getFirebase();
		const messaging = getMessaging(firebase);
		
		const token = await getToken(messaging, { 
			vapidKey, 
			serviceWorkerRegistration: registration 
		});

		if (token) {
			currentToken = token;
			const res = await api.get('/items/fcm_tokens', {
				params: { filter: { token: { _eq: token } } }
			});
			subscribed.value = res.data.data.length > 0;
		}
	} catch (e) {
		console.warn('FCM Check Error:', e);
	} finally {
		checking.value = false;
	}
};

const requestPermission = async () => {
	loading.value = true;
	error.value = '';
	try {
		const { firebase, vapidKey } = await getFirebase();
		const messaging = getMessaging(firebase);

		const permission = await Notification.requestPermission();
		if (permission !== 'granted') throw new Error('Permission denied.');

		const registration = await navigator.serviceWorker.register('/fcm/sw.js', { scope: '/fcm/' });
		const token = await getToken(messaging, { 
			vapidKey, 
			serviceWorkerRegistration: registration 
		});

		if (!token) throw new Error('Token retrieval failed.');

		await api.post('/fcm/register', { 
			token, 
			device_name: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Web Browser' 
		});
		
		subscribed.value = true;
		status.value = 'Notifications enabled!';
	} catch (err: any) {
		error.value = err.message || 'Error occurred.';
	} finally {
		loading.value = false;
	}
};

const unsubscribe = async () => {
	loading.value = true;
	try {
		const { firebase } = await getFirebase();
		const messaging = getMessaging(firebase);
		
		// 1. Find and Delete from Directus
		const searchRes = await api.get('/items/fcm_tokens', {
			params: { filter: { token: { _eq: currentToken } }, fields: ['id'] }
		});

		const item = searchRes.data.data[0];
		if (item) {
			await api.delete(`/items/fcm_tokens/${item.id}`);
		}

		// 2. Delete from Firebase
		await deleteToken(messaging);

		// 3. Unregister the Service Worker
		const registration = await navigator.serviceWorker.getRegistration('/fcm/');
		if (registration) {
			await registration.unregister();
			console.log('FCM: Service Worker unregistered.');
		}
		
		subscribed.value = false;
		status.value = 'Unsubscribed and worker removed.';
	} catch (err: any) {
		console.error('Unsubscribe Error:', err);
		error.value = 'Failed to fully unsubscribe.';
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	checkSubscription();
});
</script>

<style scoped>
.fcm-panel-container { 
	padding: 32px; 
	text-align: center; 
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
}
.panel-icon { margin-bottom: 16px; color: var(--foreground-subdued); }
.panel-icon.active { color: var(--primary); }
.mb-4 { margin-bottom: 16px; }
.checking { color: var(--foreground-subdued); }
h3 { margin-bottom: 8px; }
p { margin-bottom: 24px; color: var(--foreground-subdued); max-width: 300px; }
</style>
