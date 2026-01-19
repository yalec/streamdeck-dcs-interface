# Frontend React - Property Inspectors Integration

## Architecture

Le projet `frontend-react-js/` gère maintenant **deux types d'interfaces** :

### 1. DCS-BIOS Configuration Window (existant)
- Build par défaut : `npm run build`
- Output : `com.ctytler.dcs.sdPlugin/settingsUI/`
- Composant : `App.tsx`

### 2. Property Inspectors (nouveau)
- **Encoder PI** : `npm run build:encoder-pi`
  - Output : `com.ctytler.dcs.sdPlugin/propertyinspector/encoder-react/`
  - Composant : `EncoderPropertyInspector.tsx`
  
- **Button PI** : `npm run build:button-pi` *(à implémenter)*
  - Output : `com.ctytler.dcs.sdPlugin/propertyinspector/button-react/`
  
- **DCS-BIOS PI** : `npm run build:dcsbios-pi` *(à implémenter)*
  - Output : `com.ctytler.dcs.sdPlugin/propertyinspector/dcsbios-react/`

## Build Commands

```bash
# Build settings window (existant)
npm run build

# Build encoder property inspector
npm run build:encoder-pi

# Build tous les PIs + settings
npm run build:all
```

## Structure

```
frontend-react-js/src/
├── areas/              # DCS-BIOS config areas (existant)
├── api/                # Stream Deck API (existant)
├── components/         # Composants partagés
│   ├── ValueMappingRow.tsx      # Nouveau
│   ├── ValueMappingList.tsx     # Nouveau
│   └── ... (existants)
├── hooks/              # React hooks
│   └── usePropertyInspector.ts  # Nouveau
├── propertyinspectors/ # Property Inspectors
│   └── EncoderPropertyInspector.tsx
├── types/              # TypeScript types
│   └── PropertyInspectorTypes.ts
├── App.tsx             # DCS-BIOS config (existant)
└── index.tsx           # Router (modifié)
```

## Intégration avec build_plugin_cmake.bat

Le script de build existant reste inchangé ! Il appelle déjà :
```bat
cd Sources\frontend-react-js
call npm install
call npm run build
```

Pour builder les Property Inspectors, vous pouvez :
1. Modifier `build_plugin_cmake.bat` pour appeler `npm run build:all`
2. Ou builder manuellement les PIs quand nécessaire

## Status

✅ **Encoder Property Inspector** - Complet et fonctionnel
⏳ **Button Property Inspector** - À implémenter
⏳ **DCS-BIOS Property Inspector** - À implémenter

## Tests

```bash
cd Sources/frontend-react-js

# Développement (settings window)
npm start

# Développement (encoder PI)
REACT_APP_PI_TYPE=encoder npm start

# Build production
npm run build:encoder-pi
```

## Notes

- Les Property Inspectors partagent les mêmes `node_modules/` que l'app principale
- CSS Modules utilisés pour éviter conflits de styles
- Hook `usePropertyInspector` simplifié pour les PIs
- Backward compatibility complète avec formats legacy
