import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'fcm-panel',
	name: 'FCM Notifications',
	icon: 'notifications',
	description: 'Allow users to enable push notifications on this device.',
	component: PanelComponent,
	options: [],
	minWidth: 12,
	minHeight: 8,
});
