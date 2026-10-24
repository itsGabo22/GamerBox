package com.gamerbox.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.evaluateJavascript(
                        "(function() { " +
                        "  const evt = new CustomEvent('gamerbox-back-press', { cancelable: true }); " +
                        "  const notCancelled = window.dispatchEvent(evt); " +
                        "  if (!notCancelled) return 'HANDLED'; " +
                        "  if (window.location.pathname !== '/' && window.location.pathname !== '/login') { " +
                        "    window.history.back(); return 'BACK'; " +
                        "  } " +
                        "  return 'ROOT'; " +
                        "})()",
                        value -> {
                            if (value != null && value.contains("ROOT")) {
                                if (webView.canGoBack()) {
                                    webView.goBack();
                                } else {
                                    moveTaskToBack(true);
                                }
                            }
                        }
                    );
                }
            }
        });
    }
}
