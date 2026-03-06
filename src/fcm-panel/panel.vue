<template>
	<div class="fcm-panel-container">
		<v-info v-if="error" type="danger" icon="error">{{ error }}</v-info>
		<v-info v-if="status" type="success" icon="check">{{ status }}</v-info>
		<div v-if="!status && !error">
			<h3>Push Notifications</h3>
			<p>Click below to receive updates on this device.</p>
			<v-button @click="requestPermission" :loading="loading">
				{{ loading ? 'Enabling...' : 'Enable Notifications' }}
			</v-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const api = useApi();
const loading = ref(false);
const status = ref('');
const error = ref('');

const requestPermission = async () => {
	loading.value = true;
	error.value = '';
	try {
		const res = await api.get('/items/fcm_config');
		const config = res.data.data;
		if (!config?.firebase_config) throw new Error('Firebase configuration missing.');

		const app = initializeApp(config.firebase_config);
		const messaging = getMessaging(app);

		const permission = await Notification.requestPermission();
		if (permission !== 'granted') throw new Error('Permission denied.');

		const registration = await navigator.serviceWorker.register('/fcm/sw.js', { scope: '/fcm/' });
		const token = await getToken(messaging, { vapidKey: config.vapid_key, serviceWorkerRegistration: registration });

		if (!token) throw new Error('Token retrieval failed.');

		await api.post('/fcm/register', { token, device_name: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Web Browser' });
		status.value = 'Notifications enabled!';
	} catch (err: any) {
		error.value = err.message || 'Error occurred.';
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped>
.fcm-panel-container { padding: 20px; text-align: center; }
p { margin-bottom: 24px; color: var(--foreground-subdued); }
</style>
