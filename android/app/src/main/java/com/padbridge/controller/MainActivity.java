package com.padbridge.controller;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothHidPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
