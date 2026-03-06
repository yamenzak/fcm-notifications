import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'fcm-broadcast',
	name: 'FCM Broadcast',
	icon: 'notifications',
	description: 'Broadcast notifications to registered FCM devices.',
	overview: ({ recipient, subject }: any) => [
		{ label: 'Recipient', text: recipient },
		{ label: 'Subject', text: subject },
	],
	options: [
		{
			field: 'recipient',
			name: 'Recipient (User UUID)',
			type: 'string',
			meta: { interface: 'input', width: 'full' },
		},
		{
			field: 'subject',
			name: 'Subject',
			type: 'string',
			meta: { interface: 'input', width: 'full' },
		},
		{
			field: 'message',
			name: 'Message',
			type: 'string',
			meta: { interface: 'textarea', width: 'full' },
		},
	],
});
