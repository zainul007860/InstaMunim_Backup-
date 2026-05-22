package com.zainul.instamunim;

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
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, 1001);
        }

        this.bridge.getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void startListening() {
                runOnUiThread(() -> {
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
