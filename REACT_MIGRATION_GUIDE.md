# React Migration - Complete Guide

## Overview

This document describes the migration of HTML/JavaScript Property Inspectors to React/TypeScript for the Stream Deck DCS Interface plugin.

## Current Status

### ✅ Completed

1. **Base Infrastructure**
   - Project structure `propertyinspector-react/`
   - TypeScript configuration
   - Multi-PI build system
   - `useStreamDeckPI` hook for WebSocket communication
   - Complete TypeScript types

2. **EncoderPropertyInspector**
   - Complete migration from `encoder_prop_inspector.html`
   - Reusable components:
     - `ValueMappingRow` - Mapping row with advanced colors
     - `ValueMappingList` - Complete list with add/delete
   - Serialization/Deserialization with backward compatibility
   - Modern and typed user interface

### 🔄 In Progress

- Testing Encoder Property Inspector with hardware

### 📋 To Do

1. Migrate `ButtonPropertyInspector` (`index.html`)
2. Migrate `DcsBiosPropertyInspector` (`dcs_bios_prop_inspector.html`)
3. Unit and integration tests
4. Update `manifest.json`
5. Deprecate old HTML PIs

## Installation

```bash
cd Sources/propertyinspector-react
npm install
```

## Development

### Launch in development mode

```bash
npm start
# Opens http://localhost:3000
# Hot reload enabled
```

### Build for production

```bash
# Build encoder only
npm run build:encoder

# Build all PIs
npm run build:all
```

Builds are generated in:
- `../com.ctytler.dcs.sdPlugin/propertyinspector/encoder-react/`
- `../com.ctytler.dcs.sdPlugin/propertyinspector/button-react/`
- `../com.ctytler.dcs.sdPlugin/propertyinspector/dcsbios-react/`

## Architecture

### WebSocket Communication

The `useStreamDeckPI` hook automatically handles:
- WebSocket connection with Stream Deck
- Receiving settings
- Sending updates
- Messages to C++ plugin

```typescript
const { settings, setSettings, connected } = useStreamDeckPI<EncoderSettings>();

// Update a field
setSettings({ increment_cw: "0.1" });

// Send message to plugin
sendToPlugin({ action: "refresh" });
```

### TypeScript Types

All settings are typed:

```typescript
interface EncoderSettings extends CommonSettings {
  button_id?: string;
  device_id?: string;
  dcs_id_increment_monitor?: string;
  increment_cw?: string;
  increment_ccw?: string;
  // ... tous les champs typés
}
```

### Reusable Components

UI components are modular:

```tsx
// Component with typed props
<ValueMappingRow
  mapping={mapping}
  onChange={handleChange}
  onDelete={handleDelete}
/>

// Complete list
<ValueMappingList
  mappings={mappings}
  onChange={setMappings}
/>
```

## Stream Deck Integration

### Updating manifest.json

To use the new React PIs:

```json
{
  "Actions": [
    {
      "UUID": "com.ctytler.dcs.encoder",
      "Name": "DCS Rotary Encoder",
      "PropertyInspectorPath": "propertyinspector/encoder-react/index.html",
      // ... autres propriétés
    }
  ]
}
```

### Backend Compatibility

No C++ backend modification required! Serialization formats are identical:

- Extended format: `value:text:image:textColor:bgColor`
- Backward compatible with v2, v3, v4

## Testing

### Manual Tests

1. Build the PI: `npm run build:encoder`
2. Copy to `propertyinspector/encoder-react/`
3. Reload the plugin in Stream Deck
4. Test each functionality

### Automated Tests (to implement)

```bash
npm test
```

Tests to create:
- Serialization/Deserialization
- WebSocket Communication
- UI Components
- Complete Integration

## React Benefits

### 1. Type Safety

```typescript
// TypeScript catches errors
setSettings({ increment_cw: 123 });  // ❌ Error: string expected
setSettings({ increment_cw: "0.1" }); // ✅ OK
```

### 2. Reusable Components

Less code duplication between PIs.

### 3. State Management

```typescript
const [mappings, setMappings] = useState<ValueMappingData[]>([]);

// React automatically handles re-render
setMappings([...mappings, newMapping]);
```

### 4. Developer Experience

- Instant hot reload
- Better debugging
- Complete IDE auto-completion
- Error detection before runtime

### 5. Performance

React Virtual DOM optimizes DOM updates.

### 6. Maintainability

Cleaner and organized code vs manual DOM manipulation.

## Migrating Other PIs

### ButtonPropertyInspector (index.html)

**Sections to migrate**:
1. DCS Command settings (momentary, switch, increment)
2. Image State Change monitor
3. Title Text Change monitor
4. External windows (ID Lookup, Help, Comms)

**Estimate**: 4-6 hours

### DcsBiosPropertyInspector

**Simpler**: Single "Configure" button that opens window.

**Estimate**: 1-2 hours

## Next Steps

### Phase 1: Validation (now)

1. ✅ Build `npm run build:encoder`
2. ⏳ Test with Stream Deck hardware
3. ⏳ Validate all functionalities
4. ⏳ Fix any bugs

### Phase 2: Complete Migration

1. Migrate ButtonPropertyInspector
2. Migrate DcsBiosPropertyInspector
3. Update manifest.json
4. Complete tests

### Phase 3: Cleanup

1. Deprecate old HTML PIs
2. Remove legacy code
3. User documentation

## Troubleshooting

### Build fails

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:encoder
```

### WebSocket doesn't connect

Check that:
1. Stream Deck is running
2. The plugin is installed
3. Browser console (F12) for errors

### Settings don't save

Check:
1. `setSettings()` is called correctly
2. Types match `StreamDeckTypes.ts`
3. Serialized format is correct

## Resources

- [Stream Deck SDK Documentation](https://developer.elgato.com/documentation/stream-deck/)
- [React Documentation](https://reactjs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- `/ENCODER_DISPLAY_IMPLEMENTATION.md` - Backend documentation

## Contact

For questions about React migration, see:
- `propertyinspector-react/README.md` - Structure documentation
- `ENCODER_DISPLAY_IMPLEMENTATION.md` - Backend documentation
- Source code in `propertyinspector-react/src/`
