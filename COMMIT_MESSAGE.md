# feat: Complete React migration of IdLookupWindow and CommsWindow + DCS Saved Games support

## Overview

This commit completes the React + TypeScript migration of the two major external windows:
- **IdLookupWindow** (536 lines) - DCS module clickable data browser
- **CommsWindow** (243 lines) - Connection settings and game state debug

Both windows have been completely rebuilt from scratch following the original HTML/JavaScript patterns exactly, with full feature parity and improved UX.

## Major Features

### 1. IdLookupWindow - Complete React Rebuild

**New Functionality:**
- ✨ **Auto-loading modules on window open** - No need to click "Update" button
- ✨ **DCS Saved Games directory support** - Full support for community mods
- ✨ **Automatic state restoration** - Last selected module and search query persist
- ✨ **Enhanced UI** - Better contrast, compact rows, organized controls section

**Core Features (maintained from original):**
- Browse DCS aircraft modules and clickable controls
- Search/filter clickabledata by device, element, ID, or description
- Import controls to Property Inspector (DCS Command, Image/Text monitors, Switch states)
- Special module handling (L-39C→L-39ZA, C-101→C-101CC/EB)

**Technical Implementation:**
- Single file implementation (536 lines) following original `id_lookup_window_functions.js`
- Uses `window.opener.gotCallbackFromIdLookupWindow()` for communication
- Callbacks: `window.gotInstalledModules()` and `window.gotClickabledata()`
- Atomic state updates for reliable data import (React batching handled correctly)
- CSS Modules for styling with dark theme (#252525 background, #e0e0e0 text)

### 2. CommsWindow - Complete React Rebuild

**Features:**
- DCS connection settings (IP address, listener port, send port)
- Real-time game state display (DCS ID → Value table)
- Debug interface with refresh functionality
- Proper "no module detected" messaging when DCS not running

**Technical Implementation:**
- Clean rebuild (243 lines) following `comms_window_functions.js`
- Uses `window.opener.gotCallbackFromCommsWindow()` for communication
- Callback: `window.gotDcsGameState()` for state updates
- WebSocket state properly forwarded from Property Inspector

### 3. DCS Saved Games Directory Support

**Problem Solved:** Community aircraft mods installed in Saved Games directory were invisible to the plugin.

**Solution:**
```typescript
// Two separate path fields
dcs_install_path: "C:\\Program Files\\Eagle Dynamics\\DCS World"  // Official modules
dcs_savedgames_path: "%USERPROFILE%\\Saved Games\\DCS"           // Community mods
```

**Backend Integration:**
- C++ `RequestInstalledModules` now scans **both** directories
- Module lists automatically merged from both sources
- `RequestIdLookup` tries install path first, falls back to savedgames
- Paths saved in global settings and persist across sessions

### 4. Property Inspector Import Handling

**Complete Import Flow:**
```typescript
// ButtonPropertyInspector & EncoderPropertyInspector
ImportDcsCommand → Populates 13+ fields atomically:
  - button_id, device_id, send_address
  - press_value, release_value
  - dcs_id_increment_monitor
  - increment_value, increment_min, increment_max
  - increment_cw, increment_ccw (encoders)
  - send_when_first/second_state_value (switches)

ImportImageChange → dcs_id_compare_monitor
ImportTextChange → dcs_id_string_monitor
```

**Key Implementation Detail:**
React batching required changing from multiple `handleInputChange()` calls to single atomic `setSettings()` update to ensure all fields are populated correctly.

### 5. UI/UX Improvements

**IdLookupWindow:**
- Controls section: Organized layout with backgrounds (#1e1e1e) and borders
- Table: High contrast (#252525 bg, #e0e0e0 text), compact rows (6px padding)
- Header: Darker background (#1a1a1a) for better separation
- Selected rows: Clear blue highlight (#0e639c)
- Search: Persists across window reopens

**Auto-loading Behavior:**
```typescript
// On window open:
1. Restore paths from global_settings
2. Automatically call RequestInstalledModules
3. When modules received, auto-select last module
4. Auto-request clickabledata for that module
// Result: User sees data immediately, no manual updates needed
```

### 6. Enhanced Build System with Debug Mode

**Problem Solved:** Manual multi-step workflow (build → link → restart → find debug URL) was tedious for development.

**Solution:** `build_plugin_cmake.bat -debug`
- Sets `GENERATE_SOURCEMAP=true` automatically → React source maps for debugging
- Auto-links plugin: `streamdeck link Sources\com.ctytler.dcs.sdPlugin`
- Enables dev mode: `streamdeck dev` (exposes localhost:23654)
- Auto-restarts: `streamdeck restart com.ctytler.dcs`
- Restores directory: Returns to `ORIGINAL_DIR` after completion

**Build Process Flow:**
```batch
1. C++ compilation (CMake → NMake → bin\com.ctytler.dcs.exe)
2. React builds (npm run build:all → 6 modules compiled)
3. Package (copy to com.ctytler.dcs.sdPlugin)
4. [If -debug] Link → Dev Mode → Restart → Debugging Instructions
```

**Debugging Instructions Provided:**
- Property Inspector: Chrome DevTools at http://localhost:23654/
  - Source maps enabled for breakpoints in TypeScript code
- C++ Backend: Visual Studio → Debug → Attach to Process → com.ctytler.dcs.exe

**Impact:** One command from code changes to active debugging session (manual steps eliminated)

## Files Created/Modified

### New Files
- `Sources/frontend-react-js/src/windows/IdLookupWindow.tsx` (536 lines)
- `Sources/frontend-react-js/src/windows/IdLookupWindow.module.css` (302 lines)
- `Sources/frontend-react-js/src/windows/CommsWindow.tsx` (242 lines)
- `Sources/frontend-react-js/src/windows/CommsWindow.module.css` (128 lines)

### Modified Files
- `ButtonPropertyInspector.tsx` - Import handling with atomic state updates
- `EncoderPropertyInspector.tsx` - Import handling with atomic state updates
- `usePropertyInspector.ts` - Forwarding InstalledModules, Clickabledata, DebugDcsGameState
- `StreamDeckTypes.ts` - Added window interfaces and callback types
- `StreamdeckInterface.cpp` - Dual-path module scanning
- `build_plugin_cmake.bat` - **Enhanced with debug mode (-debug flag)**
  - Source maps generation (GENERATE_SOURCEMAP=true)
  - Auto-link, dev mode, restart workflow
  - Chrome DevTools instructions (localhost:23654)
  - Directory restoration after build

### Build Configuration
- `package.json` - New build scripts:
  ```json
  "build:idlookup-window": "set BUILD_PATH=../com.ctytler.dcs.sdPlugin/propertyinspector/idlookup-react ...",
  "build:comms-window": "set BUILD_PATH=../com.ctytler.dcs.sdPlugin/propertyinspector/comms-react ..."
  ```

### 6. Enhanced Build System with Debug Mode

**New Debug Mode (`-debug` flag):**
```batch
Tools\build_plugin_cmake.bat -debug
```

**Features:**
- ✨ **Automatic source maps** - `GENERATE_SOURCEMAP=true` for all React builds
- ✨ **Auto-link and restart** - Automatically links plugin and restarts Stream Deck
- ✨ **Dev mode enabled** - Chrome DevTools accessible at http://localhost:23654/
- ✨ **Directory restoration** - Returns to original directory after build
- ✨ **Comprehensive debugging instructions** - Console output includes:
  - Property Inspector debugging (Chrome DevTools)
  - C++ backend debugging (Visual Studio attach)
  - Log file locations

**Build Process:**
```batch
1. C++ compilation (CMake + NMake)
2. React builds with source maps (6 modules)
3. Plugin packaging
4. [If -debug] Link → Dev mode → Restart → Instructions
5. Return to original directory
```

**Impact:** Dramatically improved developer experience with one-command debug workflow.

## Testing Performed

✅ **IdLookupWindow:**
  - Auto-loads modules on open ✅
  - Restores last module and search ✅
  - Row selection with visual feedback ✅
  - All import operations populate fields correctly ✅
  - Community mod modules appear in list ✅

✅ **CommsWindow:**
  - Connection settings update correctly ✅
  - Game state displays when DCS running ✅
  - "No module detected" message when DCS stopped (expected behavior) ✅
  - Refresh button triggers state update ✅

✅ **Property Inspectors:**
  - Receive all imported fields atomically ✅
  - No race conditions or missing data ✅
  - Both Button and Encoder PIs working ✅

✅ **Build System:**
  - All 6 React modules compile: 0 errors, 0 warnings ✅
  - Debug mode with source maps functional ✅
  - Plugin restart successful ✅

## Code Quality

- ✅ Zero TypeScript errors
- ✅ Zero TypeScript warnings (except legacy StreamdeckWebsocket.tsx)
- ✅ Follows original JavaScript patterns exactly
- ✅ Proper React hooks usage (no memory leaks)
- ✅ CSS Modules for scoped styling
- ✅ Clean production code (all debug console.log() removed, only console.error() for critical errors)

## Backward Compatibility

✅ **100% Backward Compatible**
- Existing settings format unchanged
- C++ API unchanged (added parameters, not modified)
- WebSocket message formats unchanged
- Original HTML files can coexist during transition

## Migration Status

**External Windows:**
- ✅ IdLookupWindow - Complete
- ✅ CommsWindow - Complete

**Property Inspectors:**
- ✅ ButtonPropertyInspector - Complete
- ✅ EncoderPropertyInspector - Complete  
- ✅ DcsBiosPropertyInspector - Complete

**Remaining HTML (legacy, to be removed eventually):**
- `id_lookup_window.html` - Replaced by `idlookup-react/`
- `comms_window.html` - Replaced by `comms-react/`

## Breaking Changes

None - all changes maintain full backward compatibility.
