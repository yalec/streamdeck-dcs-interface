# ID Lookup Window Analysis

## Current State

### Original Architecture (HTML/JS)
Reference: `D:\dev\streamdeck-dcs-interface-master\Sources\com.ctytler.dcs.sdPlugin\`

**Main files:**
- `propertyinspector/id_lookup_window.html` - User interface
- `propertyinspector/js/id_lookup_window_functions.js` - Business logic
- `propertyinspector/js/external_windows_functions.js` - Inter-window communication

**Communication Mechanism:**
```javascript
// Opening from Property Inspector
window.idLookupWindow = window.open('id_lookup_window.html', 'ID Lookup');

// Communication Child → Parent
window.opener.gotCallbackFromIdLookupWindow({
  event: "RequestInstalledModules",
  payload: { dcs_install_path: "..." }
});

// Communication Parent → Child
window.idLookupWindow.gotInstalledModules(modulesList);
window.idLookupWindow.gotClickabledata(data);
```

### React Architecture (Current)
Reference: `D:\dev\streamdeck-dcs-interface-fork\Sources\frontend-react-js\`

**Main files:**
- `src/windows/IdLookupWindow.tsx` - React component ✅
- `src/propertyinspectors/ButtonPropertyInspector.tsx` - Opens window ✅
- `src/propertyinspectors/EncoderPropertyInspector.tsx` - Opens window ✅

**Identified Problem:**
❌ **No standalone HTML build for IdLookupWindow**
- React component exists but is not compiled separately
- Old `id_lookup_window.html` (HTML/JS) is still present
- Property Inspectors try to open the old HTML file

## Implemented Solution

### 1. Added Build Scripts
Updated `package.json` with:
```json
"build:idlookup-window": "Build standalone IdLookupWindow → idlookup-react/"
"build:comms-window": "Build standalone CommsWindow → comms-react/"
"build:all": "Now includes both new windows"
```

### 2. Improved React Routing
Updated `src/index.tsx` to support `REACT_APP_WINDOW_TYPE`:
```typescript
const windowBuildType = process.env.REACT_APP_WINDOW_TYPE;

if (windowBuildType === "idlookup" || windowType === "idlookup") {
  Component = IdLookupWindow;
} else if (windowBuildType === "comms" || windowType === "comms") {
  Component = CommsWindow;
}
```

### 3. Updated Paths
**ButtonPropertyInspector.tsx** and **EncoderPropertyInspector.tsx**:
```typescript
const urls = {
  idLookup: "../../propertyinspector/idlookup-react/index.html",  // ✅ New
  help: "../../helpDocs/helpWindow.html",
  comms: "../../propertyinspector/comms-react/index.html",        // ✅ New
};
```

## Features to Verify

### Inter-Window Communication
- ✅ `window.opener.gotCallbackFromIdLookupWindow()` - Exists in ButtonPropertyInspector.tsx
- ✅ `window.handleSendToPropertyInspector()` - Defined in IdLookupWindow.tsx
- ⚠️ **TO TEST**: Do messages pass correctly?

### Data Flow
1. User clicks "ID Lookup" → `openExternalWindow("idLookup")`
2. New window opens with `idlookup-react/index.html`
3. IdLookupWindow.tsx mounts and reads `window.opener.global_settings`
4. IdLookupWindow sends `RequestInstalledModules` via `gotCallbackFromIdLookupWindow`
5. Property Inspector receives via `gotCallbackFromIdLookupWindow()`
6. Property Inspector sends to C++ plugin via WebSocket
7. C++ plugin responds with `InstalledModules` via `sendToPropertyInspector`
8. Property Inspector forwards to IdLookupWindow via `window.idLookupWindow.handleSendToPropertyInspector()`

### Main Features
- [ ] Display installed modules
- [ ] Search in clickable data
- [ ] Import DCS commands
- [ ] Import image changes
- [ ] Import text changes
- [ ] Visible debug messages

## Next Steps

### 1. Build and Test
```powershell
cd Sources\frontend-react-js
npm install
npm run build:idlookup-window
npm run build:comms-window
```

### 2. Test in Stream Deck
```powershell
.\Tools\build_plugin_cmake.bat -debug
```

### 3. Verification
- [ ] ID Lookup window opens correctly
- [ ] DCS modules are listed
- [ ] Search works
- [ ] Command import works
- [ ] Debug logs display

### 4. Debug
If window doesn't open:
- Verify `idlookup-react/index.html` exists after build
- Check JavaScript console (F12) for errors
- Verify `window.opener` exists
- Verify `window.opener.gotCallbackFromIdLookupWindow` is defined
- Check logs in IdLookupWindow (Debug Messages section)

## HTML vs React Comparison

### React Advantages
- ✅ TypeScript for type safety
- ✅ State management with React hooks
- ✅ Reusable components
- ✅ Integrated debug messages
- ✅ Better code structure

### Compatibility
- ✅ Same communication API (`window.opener`)
- ✅ Same events
- ✅ Same payload structure
- ✅ Compatible with existing C++ plugin

## References

### Original Documentation
- `D:\dev\streamdeck-dcs-interface-master\` - HTML/JS reference version
- `external_windows_functions.js` - Original communication logic
- `id_lookup_window_functions.js` - Original business logic

### React Documentation
- [REACT_MIGRATION.md](REACT_MIGRATION.md) - Migration guide
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Migration summary
- [frontend-react-js/ARCHITECTURE.md](Sources/frontend-react-js/ARCHITECTURE.md) - React architecture

### Stream Deck CLI
```powershell
# Link plugin for development
streamdeck link Sources\com.ctytler.dcs.sdPlugin

# Enable developer mode (detailed logs)
streamdeck dev

# Restart plugin
streamdeck restart com.ctytler.dcs
```
