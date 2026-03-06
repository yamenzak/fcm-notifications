import fcmEndpoint from './fcm-endpoint/index';
import fcmHook from './fcm-hook/index';
import fcmPanel from './fcm-panel/index';

export const endpoints = [{ name: 'fcm', config: fcmEndpoint }];
export const hooks = [{ name: 'fcm-hook', config: fcmHook }];
export const panels = [{ name: 'fcm_notif_panel', config: fcmPanel }];
