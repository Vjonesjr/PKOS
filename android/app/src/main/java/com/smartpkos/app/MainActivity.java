package com.smartpkos.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        forwardSharedText(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        forwardSharedText(intent);
    }

    private void forwardSharedText(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (intent.getType() == null || !intent.getType().startsWith("text/")) return;
        final String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        final String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (sharedText == null || sharedText.trim().isEmpty()) return;
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (bridge == null || bridge.getWebView() == null) return;
            String js = "localStorage.setItem('pkos_pending_share', JSON.stringify({text:" + JSONObject.quote(sharedText) + ",subject:" + JSONObject.quote(subject == null ? "" : subject) + ",receivedAt:new Date().toISOString()}));window.dispatchEvent(new Event('pkos:native-share'));";
            bridge.getWebView().evaluateJavascript(js, null);
        }, 1200);
    }
}
