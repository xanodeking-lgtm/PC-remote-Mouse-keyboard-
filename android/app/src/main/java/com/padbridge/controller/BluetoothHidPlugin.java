package com.padbridge.controller;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothHidDevice;
import android.bluetooth.BluetoothHidDeviceAppQosSettings;
import android.bluetooth.BluetoothHidDeviceAppSdpSettings;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Set;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "BluetoothHid",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE
            }
        )
    }
)
public class BluetoothHidPlugin extends Plugin {

    private static final int REPORT_ID_MOUSE = 1;
    private static final int REPORT_ID_KEYBOARD = 2;
    private static final int REPORT_ID_GAMEPAD = 3;

    // Composite HID Descriptor: Mouse (ID 1), Keyboard (ID 2), Gamepad (ID 3)
    private static final byte[] HID_REPORT_DESCRIPTOR = new byte[] {
        // Report ID 1: Mouse (3 buttons, X, Y, Wheel)
        (byte) 0x05, (byte) 0x01, // Usage Page (Generic Desktop)
        (byte) 0x09, (byte) 0x02, // Usage (Mouse)
        (byte) 0xA1, (byte) 0x01, // Collection (Application)
        (byte) 0x85, (byte) 0x01, //   Report ID (1)
        (byte) 0x09, (byte) 0x01, //   Usage (Pointer)
        (byte) 0xA1, (byte) 0x00, //   Collection (Physical)
        (byte) 0x05, (byte) 0x09, //     Usage Page (Button)
        (byte) 0x19, (byte) 0x01, //     Usage Minimum (Button 1)
        (byte) 0x29, (byte) 0x03, //     Usage Maximum (Button 3)
        (byte) 0x15, (byte) 0x00, //     Logical Minimum (0)
        (byte) 0x25, (byte) 0x01, //     Logical Maximum (1)
        (byte) 0x95, (byte) 0x03, //     Report Count (3)
        (byte) 0x75, (byte) 0x01, //     Report Size (1)
        (byte) 0x81, (byte) 0x02, //     Input (Data, Variable, Absolute)
        (byte) 0x95, (byte) 0x01, //     Report Count (1)
        (byte) 0x75, (byte) 0x05, //     Report Size (5)
        (byte) 0x81, (byte) 0x01, //     Input (Constant)
        (byte) 0x05, (byte) 0x01, //     Usage Page (Generic Desktop)
        (byte) 0x09, (byte) 0x30, //     Usage (X)
        (byte) 0x09, (byte) 0x31, //     Usage (Y)
        (byte) 0x09, (byte) 0x38, //     Usage (Wheel)
        (byte) 0x15, (byte) 0x81, //     Logical Minimum (-127)
        (byte) 0x25, (byte) 0x7F, //     Logical Maximum (127)
        (byte) 0x75, (byte) 0x08, //     Report Size (8)
        (byte) 0x95, (byte) 0x03, //     Report Count (3)
        (byte) 0x81, (byte) 0x06, //     Input (Data, Variable, Relative)
        (byte) 0xC0,              //   End Collection
        (byte) 0xC0,              // End Collection

        // Report ID 2: Keyboard (8-bit modifiers, reserved byte, 6 keycodes)
        (byte) 0x05, (byte) 0x01, // Usage Page (Generic Desktop)
        (byte) 0x09, (byte) 0x06, // Usage (Keyboard)
        (byte) 0xA1, (byte) 0x01, // Collection (Application)
        (byte) 0x85, (byte) 0x02, //   Report ID (2)
        (byte) 0x05, (byte) 0x07, //   Usage Page (Key Codes)
        (byte) 0x19, (byte) 0xE0, //   Usage Minimum (224)
        (byte) 0x29, (byte) 0xE7, //   Usage Maximum (231)
        (byte) 0x15, (byte) 0x00, //   Logical Minimum (0)
        (byte) 0x25, (byte) 0x01, //   Logical Maximum (1)
        (byte) 0x75, (byte) 0x01, //   Report Size (1)
        (byte) 0x95, (byte) 0x08, //   Report Count (8)
        (byte) 0x81, (byte) 0x02, //   Input (Data, Variable, Absolute)
        (byte) 0x95, (byte) 0x01, //   Report Count (1)
        (byte) 0x75, (byte) 0x08, //   Report Size (8)
        (byte) 0x81, (byte) 0x01, //   Input (Constant)
        (byte) 0x95, (byte) 0x06, //   Report Count (6)
        (byte) 0x75, (byte) 0x08, //   Report Size (8)
        (byte) 0x15, (byte) 0x00, //   Logical Minimum (0)
        (byte) 0x25, (byte) 0x65, //   Logical Maximum (101)
        (byte) 0x05, (byte) 0x07, //   Usage Page (Key Codes)
        (byte) 0x19, (byte) 0x00, //   Usage Minimum (0)
        (byte) 0x29, (byte) 0x65, //   Usage Maximum (101)
        (byte) 0x81, (byte) 0x00, //   Input (Data, Array)
        (byte) 0xC0,              // End Collection

        // Report ID 3: Gamepad (16 buttons + 4 axes: X, Y, Z, Rz)
        (byte) 0x05, (byte) 0x01, // Usage Page (Generic Desktop)
        (byte) 0x09, (byte) 0x05, // Usage (Game Pad)
        (byte) 0xA1, (byte) 0x01, // Collection (Application)
        (byte) 0x85, (byte) 0x03, //   Report ID (3)
        (byte) 0x05, (byte) 0x09, //   Usage Page (Button)
        (byte) 0x19, (byte) 0x01, //   Usage Minimum (Button 1)
        (byte) 0x29, (byte) 0x10, //   Usage Maximum (Button 16)
        (byte) 0x15, (byte) 0x00, //   Logical Minimum (0)
        (byte) 0x25, (byte) 0x01, //   Logical Maximum (1)
        (byte) 0x75, (byte) 0x01, //   Report Size (1)
        (byte) 0x95, (byte) 0x10, //   Report Count (16)
        (byte) 0x81, (byte) 0x02, //   Input (Data, Variable, Absolute)
        (byte) 0x05, (byte) 0x01, //   Usage Page (Generic Desktop)
        (byte) 0x09, (byte) 0x30, //   Usage (X)
        (byte) 0x09, (byte) 0x31, //   Usage (Y)
        (byte) 0x09, (byte) 0x32, //   Usage (Z)
        (byte) 0x09, (byte) 0x35, //   Usage (Rz)
        (byte) 0x15, (byte) 0x81, //   Logical Minimum (-127)
        (byte) 0x25, (byte) 0x7F, //   Logical Maximum (127)
        (byte) 0x75, (byte) 0x08, //   Report Size (8)
        (byte) 0x95, (byte) 0x04, //   Report Count (4)
        (byte) 0x81, (byte) 0x02, //   Input (Data, Variable, Absolute)
        (byte) 0xC0               // End Collection
    };

    private final Executor executor = Executors.newSingleThreadExecutor();
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothHidDevice hidDevice;
    private BluetoothDevice hostDevice;
    private boolean isRegistered = false;

    @Override
    public void load() {
        BluetoothManager manager =
            (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (manager != null) {
            bluetoothAdapter = manager.getAdapter();
        }
    }

    private boolean isHidSupported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && bluetoothAdapter != null;
    }

    private boolean hasRequiredPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return (
                ContextCompat.checkSelfPermission(
                    getContext(),
                    Manifest.permission.BLUETOOTH_CONNECT
                ) == PackageManager.PERMISSION_GRANTED
            );
        }
        return (
            ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.BLUETOOTH
            ) == PackageManager.PERMISSION_GRANTED
        );
    }

    @SuppressLint("MissingPermission")
    private JSObject buildStatusObject() {
        JSObject res = new JSObject();
        res.put("supported", isHidSupported());
        res.put("permissionsGranted", hasRequiredPermissions());
        res.put("bluetoothEnabled", bluetoothAdapter != null && bluetoothAdapter.isEnabled());
        res.put("registered", isRegistered);
        if (hostDevice != null && hasRequiredPermissions()) {
            res.put("connectedDeviceName", hostDevice.getName());
            res.put("connectedDeviceAddress", hostDevice.getAddress());
        } else {
            res.put("connectedDeviceName", JSObject.NULL);
            res.put("connectedDeviceAddress", JSObject.NULL);
        }
        return res;
    }

    private void emitStatusUpdate() {
        notifyListeners("hidStateChange", buildStatusUpdate());
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(buildStatusObject());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || hasRequiredPermissions()) {
            call.resolve(buildStatusObject());
            return;
        }
        requestPermissionForAlias("bluetooth", call, "bluetoothPermsCallback");
    }

    @PermissionCallback
    private void bluetoothPermsCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == PermissionState.GRANTED || hasRequiredPermissions()) {
            call.resolve(buildStatusObject());
        } else {
            call.reject("Bluetooth permissions are required to pair with your PC.");
        }
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void registerHid(PluginCall call) {
        if (!isHidSupported()) {
            call.reject("Bluetooth HID Device profile requires Android 9 (API 28) or newer.");
            return;
        }
        if (!hasRequiredPermissions()) {
            call.reject("Missing Bluetooth permissions.");
            return;
        }
        if (!bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is turned off. Enable Bluetooth and try again.");
            return;
        }

        if (isRegistered && hidDevice != null) {
            call.resolve(buildStatusObject());
            return;
        }

        bluetoothAdapter.getProfileProxy(
            getContext(),
            new BluetoothProfile.ServiceListener() {
                @Override
                public void onServiceConnected(int profile, BluetoothProfile proxy) {
                    if (profile != BluetoothProfile.HID_DEVICE) return;
                    hidDevice = (BluetoothHidDevice) proxy;

                    BluetoothHidDeviceAppSdpSettings sdp = new BluetoothHidDeviceAppSdpSettings(
                        "PadBridge Controller",
                        "Ad-Free Wireless Gamepad, Mouse & Keyboard",
                        "PadBridge",
                        BluetoothHidDevice.SUBCLASS1_COMBO,
                        HID_REPORT_DESCRIPTOR
                    );

                    BluetoothHidDeviceAppQosSettings qos = new BluetoothHidDeviceAppQosSettings(
                        BluetoothHidDeviceAppQosSettings.SERVICE_BEST_EFFORT,
                        800,
                        9,
                        0,
                        11250,
                        BluetoothHidDeviceAppQosSettings.MAX
                    );

                    boolean ok = hidDevice.registerApp(
                        sdp,
                        null,
                        qos,
                        executor,
                        new BluetoothHidDevice.Callback() {
                            @Override
                            public void onAppStatusChanged(
                                BluetoothDevice pluggedDevice,
                                boolean registered
                            ) {
                                isRegistered = registered;
                                if (!registered) {
                                    hostDevice = null;
                                }
                                emitStatusUpdate();
                            }

                            @Override
                            public void onConnectionStateChanged(
                                BluetoothDevice device,
                                int state
                            ) {
                                if (state == BluetoothProfile.STATE_CONNECTED) {
                                    hostDevice = device;
                                } else if (
                                    state == BluetoothProfile.STATE_DISCONNECTED &&
                                    hostDevice != null &&
                                    hostDevice.equals(device)
                                ) {
                                    hostDevice = null;
                                }
                                emitStatusUpdate();
                            }
                        }
                    );

                    if (ok) {
                        isRegistered = true;
                        call.resolve(buildStatusObject());
                    } else {
                        call.reject("Failed to register Bluetooth HID service.");
                    }
                }

                @Override
                public void onServiceDisconnected(int profile) {
                    if (profile == BluetoothProfile.HID_DEVICE) {
                        isRegistered = false;
                        hidDevice = null;
                        hostDevice = null;
                        emitStatusUpdate();
                    }
                }
            },
            BluetoothProfile.HID_DEVICE
        );
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (!hasRequiredPermissions() || bluetoothAdapter == null) {
            call.reject("Bluetooth unavailable or missing permissions.");
            return;
        }
        JSArray devices = new JSArray();
        Set<BluetoothDevice> bonded = bluetoothAdapter.getBondedDevices();
        if (bonded != null) {
            for (BluetoothDevice d : bonded) {
                JSObject item = new JSObject();
                item.put("name", d.getName() != null ? d.getName() : "Unknown Device");
                item.put("address", d.getAddress());
                devices.put(item);
            }
        }
        JSObject result = new JSObject();
        result.put("devices", devices);
        call.resolve(result);
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void connectDevice(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Device MAC address is required.");
            return;
        }
        if (hidDevice == null || !isRegistered) {
            call.reject("Register HID service before connecting.");
            return;
        }
        if (!hasRequiredPermissions()) {
            call.reject("Missing Bluetooth permissions.");
            return;
        }
        BluetoothDevice target = bluetoothAdapter.getRemoteDevice(address);
        boolean initiated = hidDevice.connect(target);
        if (initiated) {
            call.resolve(buildStatusObject());
        } else {
            call.reject("Could not initiate HID connection to " + address);
        }
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void disconnectDevice(PluginCall call) {
        if (hidDevice != null && hostDevice != null && hasRequiredPermissions()) {
            hidDevice.disconnect(hostDevice);
            hostDevice = null;
            emitStatusUpdate();
        }
        call.resolve(buildStatusObject());
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void sendMouseReport(PluginCall call) {
        if (hidDevice == null || hostDevice == null || !hasRequiredPermissions()) {
            call.resolve();
            return;
        }
        int buttons = call.getInt("buttons", 0);
        int dx = clampSignedByte(call.getInt("dx", 0));
        int dy = clampSignedByte(call.getInt("dy", 0));
        int wheel = clampSignedByte(call.getInt("wheel", 0));

        byte[] report = new byte[] {
            (byte) (buttons & 0x07),
            (byte) dx,
            (byte) dy,
            (byte) wheel
        };
        hidDevice.sendReport(hostDevice, REPORT_ID_MOUSE, report);
        call.resolve();
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void sendKeyboardReport(PluginCall call) {
        if (hidDevice == null || hostDevice == null || !hasRequiredPermissions()) {
            call.resolve();
            return;
        }
        int modifiers = call.getInt("modifiers", 0);
        JSArray keys = call.getArray("keys");
        byte[] report = new byte[8];
        report[0] = (byte) (modifiers & 0xFF);
        report[1] = 0x00;
        if (keys != null) {
            int count = Math.min(6, keys.length());
            for (int i = 0; i < count; i++) {
                try {
                    report[2 + i] = (byte) (keys.getInt(i) & 0xFF);
                } catch (Exception ignored) {
                    report[2 + i] = 0x00;
                }
            }
        }
        hidDevice.sendReport(hostDevice, REPORT_ID_KEYBOARD, report);
        call.resolve();
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void sendGamepadReport(PluginCall call) {
        if (hidDevice == null || hostDevice == null || !hasRequiredPermissions()) {
            call.resolve();
            return;
        }
        int buttonsMask = call.getInt("buttonsMask", 0);
        int lx = clampSignedByte(call.getInt("lx", 0));
        int ly = clampSignedByte(call.getInt("ly", 0));
        int rx = clampSignedByte(call.getInt("rx", 0));
        int ry = clampSignedByte(call.getInt("ry", 0));

        byte[] report = new byte[] {
            (byte) (buttonsMask & 0xFF),
            (byte) ((buttonsMask >> 8) & 0xFF),
            (byte) lx,
            (byte) ly,
            (byte) rx,
            (byte) ry
        };
        hidDevice.sendReport(hostDevice, REPORT_ID_GAMEPAD, report);
        call.resolve();
    }

    private int clampSignedByte(int value) {
        return Math.max(-127, Math.min(127, value));
    }
}
