# React Frontend Architecture

## Overview

This project provides a unified React-based frontend for the Stream Deck DCS Interface plugin. All Property Inspectors and external windows are built using React 17 with TypeScript.

## Architecture

### Build System

The project uses **react-scripts** with multiple build targets:

```bash
npm run build        # Main settings UI (DCS-BIOS configuration)
npm run build:encoder-pi   # Encoder Property Inspector
npm run build:button-pi    # Button Property Inspector  
npm run build:dcsbios-pi   # DCS-BIOS Property Inspector
npm run build:all    # Build all targets
```

Each build uses environment variables:
- `BUILD_PATH`: Output directory (e.g., `../com.ctytler.dcs.sdPlugin/propertyinspector/button-react`)
- `REACT_APP_PI_TYPE`: Property Inspector type (`encoder`, `button`, `dcsbios`, or undefined for settings UI)

### Routing

`index.tsx` acts as a unified entry point with intelligent routing:

```typescript
// External windows (via URL parameters)
?window=idlookup  → IdLookupWindow
?window=comms     → CommsWindow

// DCS-BIOS config popup (detects window.opener.socketSettings)
window.opener.socketSettings → App (DCS-BIOS configuration)

// Property Inspectors (via REACT_APP_PI_TYPE)
REACT_APP_PI_TYPE=encoder  → EncoderPropertyInspector
REACT_APP_PI_TYPE=button   → ButtonPropertyInspector
REACT_APP_PI_TYPE=dcsbios  → DcsBiosPropertyInspector
```

### Communication Pattern

#### Stream Deck ↔ Property Inspector
Uses WebSocket via `usePropertyInspector` hook:
```typescript
const { settings, setSettings, actionInfo, sendToPlugin } = usePropertyInspector<ButtonSettings>();
```

#### Property Inspector ↔ External Windows
Uses **window.postMessage()** for type-safe inter-window communication:

**From External Window:**
```typescript
window.opener.postMessage({
  event: "ImportDcsCommand",
  payload: { button_id: "123", device_id: "456" }
}, "*");
```

**In Property Inspector:**
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.event === "ImportDcsCommand") {
      // Handle import...
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

### Key Components

#### Property Inspectors

- **ButtonPropertyInspector.tsx**: Multi-type button PI (momentary, switch, increment)
  - Auto-detects button type from action UUID
  - Manages DCS commands, image state monitors, text monitors
  - Opens external windows (ID Lookup, Help, Comms)

- **EncoderPropertyInspector.tsx**: Stream Deck Plus encoder knobs
  - Rotation settings (CW/CCW)
  - Press settings
  - Display value mappings

- **DcsBiosPropertyInspector.tsx**: DCS-BIOS configuration
  - Opens `App.tsx` in popup window

#### External Windows

- **IdLookupWindow.tsx**: DCS module clickable data browser
  - Lists installed DCS modules
  - Searches clickable elements (buttons, switches, dials)
  - Imports data to Property Inspector via postMessage
  - Special module handling: L-39C→L-39ZA, C-101→C-101CC/EB

- **CommsWindow.tsx**: DCS connection settings & debug
  - IP address/port configuration
  - Game state debug table

- **App.tsx**: DCS-BIOS configuration editor
  - Lua script editing
  - Test/import JSON files

### Hooks

#### usePropertyInspector

Centralized Stream Deck WebSocket communication:

```typescript
interface UsePropertyInspectorResult<T> {
  connected: boolean;
  settings: T;
  actionInfo?: ActionInfo;
  setSettings: (newSettings: Partial<T>) => void;
  sendToPlugin: (payload: Record<string, unknown>) => void;
}
```

Handles:
- WebSocket connection to Stream Deck
- Settings persistence
- Plugin communication
- Exposes `connectElgatoStreamDeckSocket` globally for Stream Deck SDK

### Types

Located in `src/types/`:

- **StreamDeckTypes.ts**: Common types (ActionInfo, GlobalSettings, Window extensions)
- **ButtonPropertyInspectorTypes.ts**: Button-specific settings
- **PropertyInspectorTypes.ts**: Encoder settings

### Global State Management

- **window.global_settings**: Shared across all windows
  - IP address, ports
  - DCS paths (install, saved games)
  - Last selected module, search query

- **window.socketSettings**: Stream Deck connection info
  - Port, UUID, registration event
  - Stored for DCS-BIOS popup compatibility

## Development

### Adding a New Property Inspector

1. Create component in `src/propertyinspectors/`
2. Define settings interface in `src/types/`
3. Add routing case in `index.tsx`
4. Add build script in `package.json`:
   ```json
   "build:mypi": "set \"BUILD_PATH=../com.ctytler.dcs.sdPlugin/propertyinspector/mypi-react\" && set \"REACT_APP_PI_TYPE=mypi\" && react-scripts build"
   ```
5. Update manifest.json to point to new build

### Adding External Window Communication

1. Define event in ExternalWindowCallback type
2. Add handler in ButtonPropertyInspector's message listener
3. Call `window.opener.postMessage()` from external window

## Path Resolution in Plugin Context

### Understanding Relative Paths

Stream Deck loads Property Inspectors from their respective subdirectories. Understanding the path structure is crucial:

**Plugin Structure:**
```
com.ctytler.dcs.sdPlugin/
├── settingsUI/index.html          (External windows entry point)
├── helpDocs/helpWindow.html       (Help documentation)
└── propertyinspector/
    ├── encoder-react/index.html   (Encoder PI - loaded here)
    ├── button-react/index.html    (Button PI - loaded here)
    └── dcsbios-react/index.html   (DCS-BIOS PI - loaded here)
```

**Correct Relative Paths:**

From `propertyinspector/encoder-react/index.html` or `propertyinspector/button-react/index.html`:

```typescript
// External windows (go up 2 levels to plugin root)
window.open("../../settingsUI/index.html?window=idlookup", "_blank");
window.open("../../settingsUI/index.html?window=comms", "_blank");
window.open("../../helpDocs/helpWindow.html", "_blank");
```

**Why `../../` instead of `../`?**
- Current location: `propertyinspector/button-react/` (2 levels deep)
- Target location: `settingsUI/` (at plugin root)
- Need to go up 2 levels: `../../` → plugin root

**Common Mistakes:**
```typescript
// ❌ Wrong - only goes up 1 level (ends up in propertyinspector/)
window.open("../settingsUI/index.html?window=idlookup");

// ✅ Correct - goes up 2 levels (reaches plugin root)
window.open("../../settingsUI/index.html?window=idlookup");
```

## Best Practices

### TypeScript
- All components use strict TypeScript
- No `any` types (use proper type definitions)
- Settings interfaces extend `Record<string, unknown>` for compatibility

### React Patterns
- Functional components with hooks
- CSS Modules for styling
- useCallback/useMemo for performance optimization
- Proper cleanup in useEffect

### Communication
- Always use postMessage for cross-window communication
- Validate event.data before processing
- Use `"*"` origin for postMessage (windows are from same plugin)

## Migration from HTML

Original HTML Property Inspectors have been fully migrated to React:
- `index.html` → `ButtonPropertyInspector.tsx`
- `encoder_prop_inspector.html` → `EncoderPropertyInspector.tsx`
- `dcs_bios_prop_inspector.html` → `DcsBiosPropertyInspector.tsx`
- `id_lookup_window.html` → `IdLookupWindow.tsx`
- `comms_window.html` → `CommsWindow.tsx`

All JavaScript logic from `propertyinspector/js/` has been migrated to React components and hooks.
