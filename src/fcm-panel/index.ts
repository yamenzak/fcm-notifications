import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'fcm_notif_panel',
	name: 'FCM Notifications',
	icon: 'notifications',
	description: 'FCM Push Setup',
	component: PanelComponent,
	options: [],
	minWidth: 16,
	minHeight: 16,
});
