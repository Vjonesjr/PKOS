import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
export const isNative = Capacitor.isNativePlatform();
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
function localPath(value) {
  try {
    const url = new URL(value || '/', window.location.origin);
    const path = url.pathname + url.search;
    if (url.origin !== window.location.origin || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || AUTH_PATHS.includes(url.pathname)) return '/';
    for (const key of ['access_token', 'token', 'clear_access_token']) url.searchParams.delete(key);
    return url.pathname + url.search;
  } catch { return '/'; }
}
export function nativeNavigateToLogin(notice) {
  if (notice) sessionStorage.setItem('pkos_auth_notice', notice);
  if (!AUTH_PATHS.includes(window.location.pathname)) window.location.replace('/login');
}
export function nativeLogout(redirect = true) {
  localStorage.removeItem('base44_access_token'); localStorage.removeItem('token');
  if (redirect) window.location.replace('/login');
}
export async function nativeGoogleLogin(returnTo = '/') {
  localStorage.setItem('pkos_native_return_to', localPath(returnTo));
  const url = new URL('https://base44.app/api/apps/auth/login');
  url.searchParams.set('app_id', '6ab97588d935cf6dad456bf1');
  url.searchParams.set('from_url', 'https://gorgeous-smart-brain-flow.base44.app/native-auth');
  await Browser.open({ url: url.href });
}
let initialized = false;
export function initializeNativeAuth() {
  if (!isNative || initialized) return; initialized = true;
  const receive = async ({ url: value } = {}) => {
    if (!value) return; let url;
    try { url = new URL(value); } catch { return; }
    if (url.protocol !== 'com.smartpkos.app:' || url.hostname !== 'auth' || !['', '/'].includes(url.pathname)) return;
    const hash = new URLSearchParams(url.hash.slice(1));
    const token = url.searchParams.get('access_token') || url.searchParams.get('token') || hash.get('access_token') || hash.get('token');
    await Browser.close().catch(() => {});
    if (!token) { nativeNavigateToLogin('Sign-in did not finish. Please try again.'); return; }
    localStorage.setItem('base44_access_token', token); localStorage.setItem('token', token);
    const path = localPath(localStorage.getItem('pkos_native_return_to')); localStorage.removeItem('pkos_native_return_to'); window.location.replace(path);
  };
  App.addListener('appUrlOpen', receive).catch(() => {}); App.getLaunchUrl().then(receive).catch(() => {});
}
