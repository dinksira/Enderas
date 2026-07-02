/**
 * Native app store links. When null, the landing page shows a "coming soon" state.
 */
export const APP_LINKS = Object.freeze({
  ios: import.meta.env.VITE_IOS_APP_URL || null,
  android: import.meta.env.VITE_ANDROID_APP_URL || null,
});

export function areNativeAppsAvailable() {
  return Boolean(APP_LINKS.ios || APP_LINKS.android);
}

export default APP_LINKS;
