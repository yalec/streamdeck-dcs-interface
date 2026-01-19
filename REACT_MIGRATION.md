# React Migration Guide

## Overview

This document details the migration from HTML/JavaScript Property Inspectors to React + TypeScript, completed in 2024.

## What Changed

### Before: HTML + Vanilla JavaScript
```
propertyinspector/
├── index.html                        # Button Property Inspector
├── encoder_prop_inspector.html       # Encoder Property Inspector  
├── dcs_bios_prop_inspector.html      # DCS-BIOS Property Inspector
├── id_lookup_window.html             # External: ID Lookup
├── comms_window.html                 # External: Comms Window
└── js/
    ├── index_pi.js                   # 517 lines
    ├── send_receive_functions.js     # 83 lines
    ├── external_windows_functions.js
    ├── id_lookup_window_functions.js # 322 lines
    ├── comms_window_functions.js     # 83 lines
    ├── settings_functions.js
    ├── dcs_bios_pi.js
    ├── common_pi.js
    └── common.js
```

### After: React + TypeScript
```
frontend-react-js/
├── src/
│   ├── index.tsx                     # Unified routing
│   ├── propertyinspectors/
│   │   ├── ButtonPropertyInspector.tsx
│   │   ├── EncoderPropertyInspector.tsx
│   │   └── DcsBiosPropertyInspector.tsx
│   ├── windows/
│   │   ├── IdLookupWindow.tsx
│   │   └── CommsWindow.tsx
│   ├── hooks/
│   │   └── usePropertyInspector.ts   # WebSocket + state management
│   └── types/
│       ├── StreamDeckTypes.ts
│       ├── ButtonPropertyInspectorTypes.ts
│       └── PropertyInspectorTypes.ts
└── package.json (build:all script)
```

## Migration Details

### 1. Property Inspectors

#### Button Property Inspector
- **File**: `index.html` → `ButtonPropertyInspector.tsx`
- **Lines**: 517 JS → ~400 TypeScript (with types)
- **Features**:
  - Auto-detects button type (momentary/switch/increment) from action UUID
  - Single component handles all button types
  - Modern React hooks (useState, useEffect, useCallback)
  - CSS Modules for scoped styling
  - Type-safe settings interface (33 fields)
  - External window management with postMessage

#### Encoder Property Inspector
- **File**: `encoder_prop_inspector.html` → `EncoderPropertyInspector.tsx`
- **Features**:
  - Rotation settings (CW/CCW)
  - Press settings
  - Display value mappings
  - Same usePropertyInspector hook

#### DCS-BIOS Property Inspector
- **File**: `dcs_bios_prop_inspector.html` → `DcsBiosPropertyInspector.tsx`
- **Features**:
  - Opens settingsUI/ (App.tsx) in popup window
  - Passes socketSettings for WebSocket connection
  - Minimal wrapper component

### 2. External Windows

#### ID Lookup Window
- **File**: `id_lookup_window.html` → `IdLookupWindow.tsx`
- **Lines**: 322 JS → ~350 TypeScript
- **Features**:
  - Full DCS module browser
  - Clickable data search and filtering
  - Import functions (DcsCommand, ImageChange, ComparisonMonitor, etc.)
  - Special module handling: L-39C→L-39ZA, C-101→C-101CC/EB
  - postMessage communication with Property Inspector

#### Comms Window
- **File**: `comms_window.html` → `CommsWindow.tsx`
- **Lines**: 83 JS → ~120 TypeScript
- **Features**:
  - Connection settings (IP, ports)
  - Game state debug table
  - postMessage for settings updates

### 3. Communication Architecture

#### Before: Custom Callbacks
```javascript
// External window
window.opener.gotCallbackFromIdLookupWindow(data);

// Property Inspector
window.gotCallbackFromIdLookupWindow = function(data) {
  // Handle data
};
```

#### After: postMessage API
```typescript
// External window
window.opener.postMessage({
  event: "ImportDcsCommand",
  payload: { button_id: "123", device_id: "456" }
}, "*");

// Property Inspector
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const { event: eventType, payload } = event.data as ExternalWindowCallback;
    if (eventType === "ImportDcsCommand") {
      // Handle with type safety
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

**Benefits**:
- Web standards-compliant
- Type-safe with TypeScript
- No global namespace pollution
- Easier to test and maintain
- Cleaner architecture

### 4. Build System

#### Before: Copy HTML files manually
```batch
xcopy propertyinspector\*.html Release\ /Y
```

#### After: Multi-target React builds
```json
{
  "scripts": {
    "build": "BUILD_PATH=../com.ctytler.dcs.sdPlugin/settingsUI react-scripts build",
    "build:encoder-pi": "BUILD_PATH=../encoder-react REACT_APP_PI_TYPE=encoder react-scripts build",
    "build:button-pi": "BUILD_PATH=../button-react REACT_APP_PI_TYPE=button react-scripts build",
    "build:dcsbios-pi": "BUILD_PATH=../dcsbios-react REACT_APP_PI_TYPE=dcsbios react-scripts build",
    "build:all": "npm run build && npm run build:encoder-pi && npm run build:button-pi && npm run build:dcsbios-pi"
  }
}
```

**Outputs**:
- `settingsUI/` - DCS-BIOS configuration popup
- `encoder-react/` - Encoder Property Inspector (~66 kB gzipped)
- `button-react/` - Button Property Inspector (~67 kB gzipped)
- `dcsbios-react/` - DCS-BIOS Property Inspector (~65 kB gzipped)

### 5. Type Safety

#### Before: Loose typing
```javascript
function updateSettings(settings) {
  // No type checking
  settings.button_id = "123";
}
```

#### After: Strict TypeScript
```typescript
interface ButtonSettings extends Record<string, unknown> {
  button_id?: string;
  device_id?: string;
  press_value?: string;
  // ... 30 more typed fields
}

function updateSettings(settings: ButtonSettings) {
  settings.button_id = "123"; // Type-checked
}
```

**Type Coverage**:
- StreamDeckTypes.ts: 10+ interfaces for Stream Deck SDK
- ButtonPropertyInspectorTypes.ts: Button settings
- PropertyInspectorTypes.ts: Encoder settings
- Zero `any` types in production code

### 6. Routing System

#### Unified Entry Point: index.tsx
```typescript
const urlParams = new URLSearchParams(window.location.search);
const windowType = urlParams.get("window");

if (windowType === "idlookup") {
  return <IdLookupWindow />;
} else if (windowType === "comms") {
  return <CommsWindow />;
} else if (window.opener?.socketSettings) {
  return <App />; // DCS-BIOS config
} else {
  switch (process.env.REACT_APP_PI_TYPE) {
    case "encoder": return <EncoderPropertyInspector />;
    case "button": return <ButtonPropertyInspector />;
    case "dcsbios": return <DcsBiosPropertyInspector />;
  }
}
```

**URL Examples**:
- `settingsUI/index.html?window=idlookup` → ID Lookup
- `settingsUI/index.html?window=comms` → Comms Window
- `button-react/index.html` → Button Property Inspector
- `encoder-react/index.html` → Encoder Property Inspector

## Important: Relative Paths in Plugin Context

### Path Resolution

Dans le contexte d'un plugin Stream Deck, les Property Inspectors sont chargés depuis leurs sous-dossiers respectifs. Les chemins relatifs doivent remonter à la racine du plugin :

**Structure du plugin :**
```
com.ctytler.dcs.sdPlugin/
├── settingsUI/
│   └── index.html
├── helpDocs/
│   └── helpWindow.html
└── propertyinspector/
    ├── encoder-react/
    │   └── index.html      (Property Inspector chargé ici)
    └── button-react/
        └── index.html      (Property Inspector chargé ici)
```

**Chemins depuis Property Inspector :**
```typescript
// Depuis propertyinspector/encoder-react/index.html
window.open("../../settingsUI/index.html?window=idlookup")  // ✅ Correct
window.open("../settingsUI/index.html?window=idlookup")     // ❌ Incorrect

// Depuis propertyinspector/button-react/index.html  
window.open("../../settingsUI/index.html?window=comms")     // ✅ Correct
window.open("../../helpDocs/helpWindow.html")                // ✅ Correct
```

**Pourquoi `../../` et non `../` ?**
- Property Inspector est dans : `propertyinspector/button-react/`
- Besoin de remonter 2 niveaux pour atteindre la racine du plugin
- `../../settingsUI/` = racine du plugin → settingsUI/

## Migration Results

### ✅ Improvements

1. **Type Safety**: Zero TypeScript errors, full type coverage
2. **Code Quality**: Zero ESLint warnings in production builds
3. **Maintainability**: React components easier to test and extend
4. **Standards Compliance**: postMessage API, web standards
5. **Bundle Size**: Optimized production builds (65-69 kB gzipped)
6. **Developer Experience**: Hot reload, TypeScript IntelliSense
7. **Architecture**: Clear separation of concerns, reusable hooks
8. **Documentation**: ARCHITECTURE.md, inline JSDoc comments

### 📊 Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Files | 9 JS files | 10+ TypeScript files | Better organization |
| Lines of Code | ~1,400 JS | ~1,500 TS | +7% (includes types) |
| Type Safety | None | 100% | ✅ |
| Build Warnings | N/A | 0 | ✅ |
| Bundle Size | ~200 kB (unoptimized) | ~270 kB (4 optimized builds) | ✅ Smaller per-build |
| Test Coverage | 0% | Ready for testing | ✅ |

### 🔄 Backward Compatibility

- All existing features preserved
- Settings interfaces match HTML versions
- Global settings structure unchanged
- Backend WebSocket protocol unchanged
- manifest.json updated to point to React builds

## For Developers

### Adding New Property Inspector

1. Create component in `src/propertyinspectors/`
2. Define settings interface in `src/types/`
3. Add route case in `index.tsx`
4. Add build script in `package.json`:
   ```json
   "build:mypi": "BUILD_PATH=../mypi-react REACT_APP_PI_TYPE=mypi react-scripts build"
   ```
5. Update manifest.json PropertyInspectorPath

### Testing Locally

```bash
cd Sources/frontend-react-js
npm install
npm start  # Development server
npm run build:all  # Production builds
```

### Debugging

- React DevTools extension
- TypeScript error checking in VS Code
- Console.log in components
- Network tab for WebSocket inspection

## Deprecation Plan

After validation:
1. Remove `propertyinspector/index.html`
2. Remove `propertyinspector/encoder_prop_inspector.html`
3. Remove `propertyinspector/dcs_bios_prop_inspector.html`
4. Remove `propertyinspector/id_lookup_window.html`
5. Remove `propertyinspector/comms_window.html`
6. Remove `propertyinspector/js/` folder

Keep:
- `helpDocs/helpWindow.html` (static HTML, no React needed)

## References

- React Documentation: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Stream Deck SDK: https://docs.elgato.com/sdk/
- postMessage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
