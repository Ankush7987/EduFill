import { auth } from '../firebase';
import { LIVE_API_BASE } from './liveConfig';

export const getFirebaseIdToken = async () => {
  if (!auth.currentUser) return '';

  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Unable to get Firebase ID token:', error);
    return '';
  }
};

export const liveApiFetch = async (path, options = {}) => {
  const {
    timeoutMs = 12000,
    headers = {},
    authRequired = true,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = authRequired ? await getFirebaseIdToken() : '';
    const currentUser = auth.currentUser;

    const response = await fetch(`${LIVE_API_BASE}${path}`, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
        ...(currentUser?.email ? { 'x-user-email': currentUser.email } : {}),
        ...headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return data;
  } finally {
    window.clearTimeout(timeout);
  }
};