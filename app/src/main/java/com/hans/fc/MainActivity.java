package com.hans.fc;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> filePick;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#12301d"));
        w.setNavigationBarColor(Color.parseColor("#12301d"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0b1d12"));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (filePick != null) filePick.onReceiveValue(null);
                filePick = cb;
                try {
                    startActivityForResult(params.createIntent(), 77);
                } catch (Exception e) {
                    filePick = null;
                    return false;
                }
                return true;
            }
        });
        web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(function(){try{return window.__back()?'1':'0'}catch(e){return '0'}})()", v -> {
            if (v == null || !v.contains("1")) finish();
        });
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == 77 && filePick != null) {
            filePick.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            filePick = null;
        }
    }

    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); }
}
