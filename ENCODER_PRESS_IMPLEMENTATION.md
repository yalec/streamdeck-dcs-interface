# Stream Deck+ Encoder Support - Complete Implementation

## Overview
This document describes the complete implementation of Stream Deck+ rotary encoder support, including rotation, display, physical button press, and LCD touch screen functionality.

## Part 1: Initial Encoder Support (Previous Work)

### Created EncoderAction Class
Separated encoder functionality from IncrementAction to provide dedicated handling for Stream Deck+ encoders.

**EncoderAction.h / EncoderAction.cpp**
- Created new class inheriting from `SendActionInterface`
- Implemented `handleEncoderRotation()` - processes clockwise/counter-clockwise rotation with tick counts
- Implemented `handleEncoderPress()` - sends fixed value when encoder is pressed/touched
- Implemented `getCurrentDisplayValue()` - retrieves current value for LCD display
- Implemented `getCurrentImagePath()` - provides background image for LCD
- Uses `IncrementMonitor` to track DCS state for incremental changes

### Created EncoderDisplayMonitor
Dedicated monitor for encoder LCD display updates.

**EncoderDisplayMonitor.h / EncoderDisplayMonitor.cpp**
- Monitors DCS values specified in `dcs_id_increment_monitor` setting
- Supports value-to-text mapping via `encoder_value_text_mapping` (format: "value1:text1;value2:text2;...")
- Returns display data including value string and optional indicator
- Integrated into `StreamdeckContext::updateContextState()` for periodic updates

### Added Stream Deck+ Event Support
Extended the SDK connection manager to handle encoder-specific events.

**ESDSDKDefines.h**
- Added `kESDSDKEventDialRotate` - encoder rotation events
- Added `kESDSDKEventDialPress` - encoder button press/release events  
- Added `kESDSDKEventTouchTap` - encoder LCD touch events

**ESDBasePlugin.h**
- Added virtual methods: `DialRotateForAction()`, `DialPressForAction()`, `TouchTapForAction()`

**ESDConnectionManager.cpp**
- Added event routing for `dialRotate`, `dialPress`, `touchTap` events

### Updated StreamdeckContext
Integrated encoder-specific handling into the context management system.

**StreamdeckContext.h / StreamdeckContext.cpp**
- Added `handleEncoderRotation()` method with dynamic_cast to EncoderAction
- Added `handleEncoderPress()` method with dynamic_cast to EncoderAction
- Added `EncoderDisplayMonitor` member for LCD updates
- Modified `updateContextState()` to call `SetFeedback()` for encoder display updates
- Passes settings in payload to encoder action handlers

### Updated StreamdeckInterface
Implemented routing from SDK events to context handlers.

**StreamdeckInterface.h / StreamdeckInterface.cpp**
- Implemented `DialRotateForAction()` - extracts tick count and calls `handleEncoderRotation()`
- Partial implementation of `DialPressForAction()` - initially with pressed field check
- Partial implementation of `TouchTapForAction()` - initially calling button pressed/released events

### Updated SendActionFactory
Registered encoder action UUIDs.

**SendActionFactory.h / SendActionFactory.cpp**
- Added `ButtonAction::ENCODER` enum value
- Registered `"com.ctytler.dcs.encoder.rotary"` → `ButtonAction::ENCODER`
- Registered `"com.ctytler.dcs.encoder.rotary.text"` → `ButtonAction::ENCODER`
- Factory creates `EncoderAction` instance for encoder UUIDs

### Created Property Inspector
Built UI for configuring encoder actions.

**encoder_prop_inspector.html**
- Fields for `send_address` (device_id,button_id format)
- Fields for `increment_cw` and `increment_ccw` (rotation values)
- Field for `encoder_press_value` (fixed value to send on press/touch)
- Fields for `increment_min` and `increment_max` (range limits)
- Field for `dcs_id_increment_monitor` (DCS address to monitor for display)
- Field for `encoder_value_text_mapping` (value-to-text display mappings)
- Integration with ID lookup window via `external_windows_functions.js`

### Updated Manifest
Defined encoder actions in the plugin manifest.

**manifest.json**
- Added action: `"com.ctytler.dcs.encoder.rotary"` with layout "$B2"
- Added action: `"com.ctytler.dcs.encoder.rotary.text"` with text display variant
- Set `"Controllers": ["Encoder"]` to restrict to encoder slots
- Defined trigger descriptions for Rotate, Push, and Touch interactions

## Part 2: Bug Fixes and Complete Implementation (This Session)

## Changes Made

### 1. Fixed ID Lookup Window - Encoder Parameter Initialization

When clicking a DCS command in the ID lookup window, the encoder parameters (CW/CCW increments and send_address) were not being properly initialized.

#### Problem:
- `increment_cw` and `increment_ccw` fields remained empty after selecting a DCS command
- `send_address` was not constructed from device_id and button_id
- Negative `click_value` from DCS-BIOS caused incorrect sign for rotation increments

#### Solution:
**external_windows_functions.js** (ImportDcsCommand function)
- Constructs `send_address` by concatenating device_id and button_id: `send_address = device_id + "," + button_id`
- Uses `Math.abs()` to ensure proper sign handling for rotation increments:
  ```javascript
  var abs_click_value = Math.abs(parseFloat(parameter.payload.click_value));
  settings["increment_cw"] = abs_click_value.toString();        // Always positive
  settings["increment_ccw"] = (-abs_click_value).toString();     // Always negative
  ```
- This correctly handles DCS commands where `click_value` can be negative

### 2. Added Support for `dialUp` Event

The Stream Deck+ SDK sends two separate events for encoder button interactions:
- **`dialPress`** - Triggered when the encoder button is pressed down
- **`dialUp`** - Triggered when the encoder button is released

Previously, only `dialPress` was partially handled. This implementation adds full support for `dialUp`.

#### Files Modified:

**ESDBasePlugin.h**
- Added virtual method `DialUpForAction()` to handle encoder button release events

**ESDConnectionManager.cpp**
- Added event handler for `kESDSDKEventDialUp` to route release events to the plugin

**StreamdeckInterface.h / StreamdeckInterface.cpp**
- Added `DialUpForAction()` method declaration and implementation
- `DialUpForAction()` calls `handleEncoderPress()` to send the configured command value

### 3. Implemented Touch Support for Encoder LCD Screen

The Stream Deck+ encoders have an LCD touchscreen that generates `touchTap` events when tapped.

#### Files Modified:

**EncoderAction.cpp**
- Modified `handleButtonReleasedEvent()` to call `handleEncoderPress()`
- This allows touch taps on the encoder LCD to send the same command as physical button presses
- Touch events are handled on release (when finger is lifted) for consistency

## Behavior Summary

### Encoder Physical Button (dialPress/dialUp)
1. User presses the encoder button → `dialPress` event received (no action)
2. User releases the encoder button → `dialUp` event received
3. Plugin sends `encoder_press_value` (or `increment_min` as fallback) to DCS

### Encoder LCD Touch (touchTap)
1. User touches the LCD screen → `handleButtonPressedEvent` called (no action)
2. User lifts finger → `handleButtonReleasedEvent` called
3. Plugin sends `encoder_press_value` (or `increment_min` as fallback) to DCS

### Encoder Rotation (dialRotate)
- Clockwise rotation → sends `increment_cw` value
- Counter-clockwise rotation → sends `increment_ccw` value

## Technical Notes

### Why Handle Release Instead of Press?
Both encoder button and LCD touch handle commands on **release** rather than press for consistency with momentary button behavior. This provides better user feedback and prevents accidental double-triggers.

### Fallback Value
If `encoder_press_value` is not configured, the system falls back to `increment_min` as the default value to send. This provides a sensible default behavior (reset to minimum).

### Event Flow
```
Physical Button Click:
  dialPress (pressed=true) → [ignored]
  dialUp                   → handleEncoderPress() → send_command()

LCD Touch:
  touchTap → handleButtonReleasedEvent() → handleEncoderPress() → send_command()

Rotation:
  dialRotate (ticks > 0)   → send increment_cw
  dialRotate (ticks < 0)   → send increment_ccw
```

## Testing
Verified on Stream Deck+ with DCS World:
- ✅ Encoder rotation (CW/CCW) sends correct increment values
- ✅ Physical button press sends configured value on release
- ✅ LCD touch sends configured value on release
- ✅ ID lookup window properly initializes all encoder parameters
- ✅ Negative click_value handled correctly with absolute value conversion

## Compatibility
- Requires Stream Deck+ hardware (encoders not available on standard Stream Deck)
- Fully backwards compatible with existing button actions
- No changes required to existing configurations
