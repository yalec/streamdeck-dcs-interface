# Changelog

All notable changes to this fork will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### IdLookupWindow and CommsWindow - Complete React Migration (2026-01-19)
- **IdLookupWindow** (536 lines) - Full React rebuild from HTML/JavaScript
  - ✨ Auto-loads modules on window open (no manual "Update" needed)
  - ✨ Auto-restores last selected module and search query
  - ✨ Enhanced table UI: Better contrast (#252525 bg, #e0e0e0 text), compact rows (6px padding)
  - ✨ Organized controls section with visual hierarchy
  - ✨ Row selection with clear blue highlight (#0e639c)
  - Complete import functionality: DCS Command, Image/Text monitors, Switch states
  - All 13+ fields populate correctly via atomic state updates
  - Special module handling (L-39C→L-39ZA, C-101→C-101CC/EB)
  
- **CommsWindow** (242 lines) - Full React rebuild from HTML/JavaScript
  - Connection settings management (IP, listener port, send port)
  - Real-time DCS game state display
  - Debug interface with refresh functionality
  - Proper messaging when DCS not running

- **DCS Saved Games Directory Support**
  - New field in IdLookupWindow for community mods location
  - Backend scans both install directory and saved games directory
  - Automatic merging of module lists from both sources
  - Paths persist in global settings across sessions
  - **Impact**: Community aircraft mods now fully supported

**Technical Implementation:**
- Follows original JavaScript patterns exactly for compatibility
- Uses `window.opener` communication pattern with typed callbacks
- Atomic state updates handle React batching correctly
- CSS Modules for scoped dark theme styling
- Zero TypeScript errors, zero warnings
- Build scripts: `npm run build:idlookup-window`, `npm run build:comms-window`

**Files Created:**
- `IdLookupWindow.tsx` + `.module.css`
- `CommsWindow.tsx` + `.module.css`
- Updated Property Inspectors with complete import handling
- Enhanced `usePropertyInspector.ts` hook for data forwarding

**C++ Backend Changes:**
- `RequestInstalledModules` scans both directories
- `RequestIdLookup` tries install path first, falls back to savedgames
- Module name normalization for community mods with version numbers

#### Enhanced Build System with Debug Mode (2026-01-19)
- **Debug Mode Flag**: `build_plugin_cmake.bat -debug`
  - Automatically generates source maps for React code (GENERATE_SOURCEMAP=true)
  - Auto-links plugin to Stream Deck CLI
  - Enables developer mode and restarts plugin
  - Opens Chrome DevTools debugging at http://localhost:23654/
  - Returns to original directory after completion
- **Improved Build Flow**:
  - C++ → React (6 modules) → Package → [Debug workflow]
  - Comprehensive debugging instructions in console output
  - Property Inspector debugging (Chrome DevTools with source maps)
  - C++ backend debugging (Visual Studio attach instructions)
- **Developer Experience**: One-command workflow from code to debugging

#### Full React + TypeScript Frontend Migration
- Migrated all Property Inspectors to React 17 + TypeScript
  - ButtonPropertyInspector: Multi-type (momentary/switch/increment) with auto-detection
  - EncoderPropertyInspector: Stream Deck Plus encoder support
  - DcsBiosPropertyInspector: DCS-BIOS configuration popup
- Migrated external windows to React
  - IdLookupWindow: DCS module clickable data browser
  - CommsWindow: Connection settings & game state debug
- Created unified routing system via `index.tsx` (URL params + environment variables)
- Implemented `usePropertyInspector` hook for centralized WebSocket communication
- Added comprehensive TypeScript type definitions (`StreamDeckTypes.ts`)
- Migrated to `window.postMessage()` API for inter-window communication (web standards-compliant)
- Multi-target build system: settingsUI/, encoder-react/, button-react/, dcsbios-react/
- Zero TypeScript errors, zero ESLint warnings in production builds
- Full architectural documentation in `frontend-react-js/ARCHITECTURE.md`
- Removed deprecated HTML files (id_lookup_window.html, comms_window.html, index.html, etc.)
- Fixed relative paths for plugin context (../../ from Property Inspectors)
- Updated build_plugin_cmake.bat to build all React targets (npm run build:all)

#### Community Aircraft Modules Support
- Added support for detecting and loading community aircraft modules from DCS Saved Games directory
- New "DCS Saved Games Directory" field in ID Lookup window for specifying community mods location
- Automatic scanning of both installation directory (`/mods/aircraft/`) and saved games directory (`/Mods/aircraft/`)
- Backend now tries both paths when searching for module clickabledata
- Enhanced module name normalization for community modules with version numbers
- Special handling for Rafale variants and other community modules with complex folder names

**Configuration:**
- ID Lookup window now includes two directory fields:
  - **DCS World Install Directory**: For official modules (e.g., `C:\Program Files\Eagle Dynamics\DCS World`)
  - **DCS Saved Games Directory**: For community modules (e.g., `%userprofile%\Saved Games\DCS`)
- Both paths are saved in global settings and persist across sessions
- Module list automatically merges results from both directories

**Technical Details:**
- Modified frontend JavaScript to send both paths to backend
- Updated `StreamdeckInterface.cpp` to scan and merge module lists from both directories
- Enhanced `RequestIdLookup` to fallback to saved games path when module not found in install path
- Improved `get_aircraft_type()` normalization for modules with version numbers in folder names

**Impact:**
- Community modules are now fully accessible alongside official modules
- No manual configuration needed beyond specifying the saved games path once
- Seamless integration with existing ID Lookup workflow

#### MOVABLE_LEV Class Type Support
- Added support for `MOVABLE_LEV` (class type 5) in clickabledata parsing
- The ID Lookup window now correctly displays controls using `MOVABLE_LEV` class type
- Proper extraction of `gain` parameter as click value for lever-based controls
- Affects aircraft modules such as:
  - F4U-1D Corsair (trim controls, throttle, propeller governor, mirror adjustments)
  - Any other modules using movable lever controls

**Technical Details:**
- Modified `Sources/com.ctytler.dcs.sdPlugin/bin/extract_clickabledata.lua`
  - Added `MOVABLE_LEV = 5` to class_type enumeration
  - Updated `get_class_enum_label()` to recognize class type 5
  - Enhanced `collect_element_attributes()` to use `gain` values for LEV and MOVABLE_LEV types instead of `arg_value`

**Impact:**
- Previously hidden controls are now accessible through the ID Lookup interface
- Correct increment values are extracted for precise control mapping
- Consistent behavior between LEV and MOVABLE_LEV types

See [MOVABLE_LEV_SUPPORT.md](MOVABLE_LEV_SUPPORT.md) for complete technical documentation.

#### Stream Deck Plus Encoder Support
- Full rotary encoder support with separate CW/CCW increment values
- Encoder press action with fixed value transmission
- Real-time LCD display of DCS values
- Value-to-text mapping system for custom display labels
- Automatic gauge visualization based on min/max ranges
- Live configuration updates without restart required

See [ENCODER_PRESS_IMPLEMENTATION.md](ENCODER_PRESS_IMPLEMENTATION.md) for implementation details.

### Fixed
- Controls with MOVABLE_LEV class type now appear in ID Lookup results
- Correct click/increment values extracted for all lever-type controls

### Changed
- Lever controls (LEV and MOVABLE_LEV) now use `gain` parameter as click value instead of `arg_value`
- This provides the actual increment value per interaction rather than the default position

---

## Version History

This fork builds upon the original [streamdeck-dcs-interface](https://github.com/charlestytler/streamdeck-dcs-interface) project.
