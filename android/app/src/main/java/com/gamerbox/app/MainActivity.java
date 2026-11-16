package com.gamerbox.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            // Feels native: no overscroll glow, no pinch zoom.
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            WebSettings settings = webView.getSettings();
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
        }

        // Hardware back is decided by the web layer (intro, tutorial, modals, history, exit hint).
        // It dispatches a cancelable "gamerbox-back-press"; if nothing handles it, the app minimizes.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView view = getBridge() != null ? getBridge().getWebView() : null;
                if (view == null) {
                    moveTaskToBack(true);
                    return;
                }
                view.evaluateJavascript(
                    "(function(){var e=new CustomEvent('gamerbox-back-press',{cancelable:true});" +
                    "return window.dispatchEvent(e)?'EXIT':'HANDLED';})()",
                    value -> {
                        if (value == null || value.contains("EXIT")) {
                            moveTaskToBack(true);
                        }
                    }
                );
            }
        });
    }
}
