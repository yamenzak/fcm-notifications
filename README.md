# FCM Notifications for Directus

![FCM Notifications Cover](fcm-notifications.png)

Send Firebase Cloud Messages (FCM) to users via system notifications.
 This extension provides a self-contained bundle including a settings singleton, multi-device token registration, and automatic notification broadcasting.

## Features

- **Automatic Setup**: Collections and fields are created on first initialization.
- **Multi-Device Support**: Users can register multiple browsers or devices for push notifications.
- **Smart Grouping**: Group notifications by collection or global tag to prevent clutter.
- **Dynamic Configuration**: Configure Firebase credentials and UI branding directly in the Data Studio.
- **iOS Support**: Intelligent detection and guidance for iPhone users to add the PWA to their home screen.
- **CSP Compliant**: Bundled Firebase SDK and Base64 icon proxying ensure compatibility with strict security policies.

## Installation

Search for `fcm-notify` in the Directus Marketplace or install via npm:

```bash
npm install directus-extension-fcm-notify
```

## Setup

1. **Firebase Configuration**: 
   - Go to **FCM Settings** in the side navigation.
   - Paste your **Firebase Client Config** (JSON) and **Service Account Key** (JSON).
   - Add your **VAPID Key** from the Firebase Console.
2. **User Opt-in**: 
   - Add the **FCM Notifications** panel to any Insights dashboard.
   - Users can click **Enable Notifications** to register their current device.
3. **Permissions**: 
   - **Collections**: For maximum security, set both `fcm_config` and `fcm_tokens` to **No Access** for all roles. 
   - **API**: The extension uses a custom endpoint to securely proxy only the necessary public configuration to users.

## Usage

Once configured, any standard system notification sent to a user in Directus will be automatically broadcast to all their registered FCM devices. Notifications are grouped by collection name by default to keep the notification center organized.
