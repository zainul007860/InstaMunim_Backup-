package com.zainul.instamunimpos;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.content.Intent;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.RecognitionListener;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SpeechRecognizer speechRecognizer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Intercept network failure to load Vercel and show our custom offline screen
        this.bridge.getWebView().setWebViewClient(new com.getcapacitor.BridgeWebViewClient(this.bridge) {
            @Override
            public void onReceivedError(android.webkit.WebView view, android.webkit.WebResourceRequest request, android.webkit.WebResourceError error) {
                if (request.isForMainFrame()) {
                    view.loadUrl("file:///android_asset/public/offline.html");
                } else {
                    super.onReceivedError(view, request, error);
                }
            }

            @Override
            public void onReceivedError(android.webkit.WebView view, int errorCode, String description, String failingUrl) {
                view.loadUrl("file:///android_asset/public/offline.html");
            }
        });
        
        this.bridge.getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void startListening() {
                runOnUiThread(() -> {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.RECORD_AUDIO}, 1002);
                    } else {
                        startListeningInternal();
                    }
                });
            }
            
            @JavascriptInterface
            public void stopListening() {
                runOnUiThread(() -> {
                    if (speechRecognizer != null) {
                        speechRecognizer.stopListening();
                    }
                });
            }
        }, "NativeSpeech");
    }

    private void startListeningInternal() {
        if (speechRecognizer == null) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                public void onReadyForSpeech(Bundle params) {
                    bridge.getWebView().evaluateJavascript("if(window.onNativeSpeechStart) window.onNativeSpeechStart();", null);
                }
                public void onBeginningOfSpeech() {}
                public void onRmsChanged(float rmsdB) {}
                public void onBufferReceived(byte[] buffer) {}
                public void onEndOfSpeech() {}
                public void onError(int error) {
                    bridge.getWebView().evaluateJavascript("if(window.onNativeSpeechError) window.onNativeSpeechError(" + error + ");", null);
                }
                public void onResults(Bundle results) {
                    java.util.ArrayList<String> data = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (data != null && data.size() > 0) {
                        String text = data.get(0).replace("'", "\\'");
                        bridge.getWebView().evaluateJavascript("if(window.onNativeSpeechResult) window.onNativeSpeechResult('" + text + "');", null);
                    } else {
                        bridge.getWebView().evaluateJavascript("if(window.onNativeSpeechResult) window.onNativeSpeechResult('');", null);
                    }
                }
                public void onPartialResults(Bundle partialResults) {
                    java.util.ArrayList<String> data = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (data != null && data.size() > 0) {
                        String text = data.get(0).replace("'", "\\'");
                        bridge.getWebView().evaluateJavascript("if(window.onNativeSpeechPartial) window.onNativeSpeechPartial('" + text + "');", null);
                    }
                }
                public void onEvent(int eventType, Bundle params) {}
            });
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        speechRecognizer.startListening(intent);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 1002) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startListeningInternal();
            } else {
                bridge.getWebView().evaluateJavascript("if(window.onNativeSpeechError) window.onNativeSpeechError(9);", null);
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null) {
            this.bridge.getWebView().evaluateJavascript(
                "if (window.handleHardwareBack) { window.handleHardwareBack(); } else { 'EXIT'; }", 
                value -> {
                    if ("\"EXIT\"".equals(value) || "null".equals(value)) {
                        showExitDialog();
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }

    private void showExitDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Exit App")
            .setMessage("Are you sure you want to exit the application?")
            .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    finish();
                }
            })
            .setNegativeButton("No", null)
            .show();
    }
}
