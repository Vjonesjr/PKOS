import { guardClient } from "@/lib/mvp/guardClient";
import { createClient } from '@base44/sdk';
import { Capacitor } from '@capacitor/core';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const isNative = Capacitor.isNativePlatform();

const client = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: isNative ? 'https://base44.app' : '',
  appBaseUrl: isNative
    ? appBaseUrl || 'https://gorgeous-smart-brain-flow.base44.app'
    : appBaseUrl
});

export const base44 = guardClient(client);
