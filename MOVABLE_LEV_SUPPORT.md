# MOVABLE_LEV Support Implementation

## Overview

This document describes the implementation of support for the `MOVABLE_LEV` class type in DCS clickabledata parsing, which was previously unsupported by the ID Lookup system.

## Problem

The original `extract_clickabledata.lua` script only supported class types 0-4:
- `NULL` (0)
- `BTN` (1) - Button
- `TUMB` (2) - Tumbler/Switch
- `SNGBTN` (3) - Single Button
- `LEV` (4) - Lever

However, many aircraft modules (such as the F4U-1D Corsair) use `MOVABLE_LEV` (5) for interactive lever controls like:
- Trim controls (yaw, pitch, bank)
- Throttle
- Propeller governor
- Mirror adjustments
- Various dimmer/adjustment knobs

These controls were silently ignored during ID lookup, making them inaccessible through the Stream Deck interface.

## Solution

### 1. Class Type Definition

Added `MOVABLE_LEV = 5` to the class type enumeration in `extract_clickabledata.lua`:

```lua
class_type = 
{
    NULL   = 0,
    BTN    = 1,
    TUMB   = 2,
    SNGBTN = 3,
    LEV    = 4,
    MOVABLE_LEV = 5
}
```

### 2. Class Label Recognition

Updated `get_class_enum_label()` function to return "MOVABLE_LEV" for class type 5:

```lua
function get_class_enum_label(class)
    if class == 0 then
        return "NULL"
    elseif class == 1 then
        return "BTN"
    elseif class == 2 then
        return "TUMB"
    elseif class == 3 then
        return "SNGBTN"
    elseif class == 4 then
        return "LEV"
    elseif class == 5 then
        return "MOVABLE_LEV"
    else
        return ""
    end
end
```

### 3. Gain Value Extraction

The most critical fix: LEV and MOVABLE_LEV types use the `gain` parameter (increment per interaction) rather than `arg_value` (default position) as the meaningful "click value" for Stream Deck commands.

Updated `collect_element_attributes()` to:
1. Extract the `gain` field from elements
2. For LEV (4) and MOVABLE_LEV (5) types, use `gain` as the click value instead of `arg_value`

```lua
local gains = elements[element_id].gain
-- ...
local gain = get_index_value(gains,idx)

-- For LEV and MOVABLE_LEV types, use gain as the click value if available
if (class == 4 or class == 5) and (gain ~= nil and gain ~= "") then
    arg_value = gain
end
```

## Example

For a typical MOVABLE_LEV control in the Corsair:

```lua
elements["pnt_161"] = default_lever_limited(
    _("Trim yaw"), 
    devices.CONTROL, 
    device_commands.Rudder_trim, 
    161, 
    0.0,              -- default position
    0.1,              -- gain (increment)
    true, 
    false,
    {-0.645, 0.645},  -- arg_lim
    {0,180,0}
)
```

**Before fix:**
- Click Value: 0.0 (incorrect - default position)
- Limits: -0.645 to 0.645

**After fix:**
- Click Value: 0.1 (correct - gain/increment)
- Limits: -0.645 to 0.645

## Impact

This change enables full support for:
- F4U-1D Corsair trim controls, throttle, propeller governor, and other lever-based controls
- Any other aircraft modules using `MOVABLE_LEV` class type
- Consistent behavior between `LEV` and `MOVABLE_LEV` types in terms of increment values

## Files Modified

- `Sources/com.ctytler.dcs.sdPlugin/bin/extract_clickabledata.lua`
  - Added `MOVABLE_LEV = 5` to class_type table
  - Updated `get_class_enum_label()` to handle class type 5
  - Updated `collect_element_attributes()` to extract and use `gain` for LEV/MOVABLE_LEV types

## Testing

Test with aircraft modules that use MOVABLE_LEV:
1. Open the ID Lookup window
2. Select F4U-1D Corsair (or similar module)
3. Search for controls like "Trim", "Throttle", "Mirror"
4. Verify controls appear with correct:
   - Type: MOVABLE_LEV
   - Click Value: gain value (not default position)
   - Limit Min/Max: correct arg_lim values

## Compatibility

This change is backward compatible - it only adds recognition for a previously unsupported class type. Existing LEV, BTN, TUMB controls continue to work exactly as before.
