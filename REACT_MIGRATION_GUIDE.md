# Migration vers React - Guide Complet

## Vue d'Ensemble

Ce document décrit la migration des Property Inspectors HTML/JavaScript vanilla vers React/TypeScript pour le plugin Stream Deck DCS Interface.

## État Actuel

### ✅ Complété

1. **Infrastructure de base**
   - Structure de projet `propertyinspector-react/`
   - Configuration TypeScript
   - Build system multi-PI
   - Hook `useStreamDeckPI` pour communication WebSocket
   - Types TypeScript complets

2. **EncoderPropertyInspector**
   - Migration complète de `encoder_prop_inspector.html`
   - Composants réutilisables :
     - `ValueMappingRow` - Ligne de mapping avec couleurs avancées
     - `ValueMappingList` - Liste complète avec add/delete
   - Serialization/Deserialization avec backward compatibility
   - Interface utilisateur moderne et typée

### 🔄 En Cours

- Tests du Property Inspector encodeur avec hardware

### 📋 À Faire

1. Migration `ButtonPropertyInspector` (`index.html`)
2. Migration `DcsBiosPropertyInspector` (`dcs_bios_prop_inspector.html`)
3. Tests unitaires et d'intégration
4. Mise à jour du `manifest.json`
5. Dépréciation des anciens PIs HTML

## Installation

```bash
cd Sources/propertyinspector-react
npm install
```

## Développement

### Lancer en mode développement

```bash
npm start
# Ouvre http://localhost:3000
# Hot reload activé
```

### Build pour production

```bash
# Build encodeur uniquement
npm run build:encoder

# Build tous les PIs
npm run build:all
```

Les builds sont générés dans :
- `../com.ctytler.dcs.sdPlugin/propertyinspector/encoder-react/`
- `../com.ctytler.dcs.sdPlugin/propertyinspector/button-react/`
- `../com.ctytler.dcs.sdPlugin/propertyinspector/dcsbios-react/`

## Architecture

### Communication WebSocket

Le hook `useStreamDeckPI` gère automatiquement :
- Connexion WebSocket avec Stream Deck
- Réception des settings
- Envoi des updates
- Messages vers le plugin C++

```typescript
const { settings, setSettings, connected } = useStreamDeckPI<EncoderSettings>();

// Mise à jour d'un champ
setSettings({ increment_cw: "0.1" });

// Envoi message au plugin
sendToPlugin({ action: "refresh" });
```

### Types TypeScript

Tous les settings sont typés :

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

### Composants Réutilisables

Les composants UI sont modulaires :

```tsx
// Composant avec props typées
<ValueMappingRow
  mapping={mapping}
  onChange={handleChange}
  onDelete={handleDelete}
/>

// Liste complète
<ValueMappingList
  mappings={mappings}
  onChange={setMappings}
/>
```

## Intégration Stream Deck

### Mise à jour du manifest.json

Pour utiliser les nouveaux PIs React :

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

### Compatibilité Backend

Aucune modification du backend C++ requise ! Les formats de sérialisation sont identiques :

- Format étendu : `value:text:image:textColor:bgColor`
- Backward compatible avec v2, v3, v4

## Testing

### Tests Manuels

1. Build le PI : `npm run build:encoder`
2. Copier dans `propertyinspector/encoder-react/`
3. Reload le plugin dans Stream Deck
4. Tester chaque fonctionnalité

### Tests Automatisés (à implémenter)

```bash
npm test
```

Tests à créer :
- Serialization/Deserialization
- Communication WebSocket
- Composants UI
- Intégration complète

## Avantages de React

### 1. Type Safety

```typescript
// TypeScript attrape les erreurs
setSettings({ increment_cw: 123 });  // ❌ Erreur: string attendu
setSettings({ increment_cw: "0.1" }); // ✅ OK
```

### 2. Composants Réutilisables

Moins de duplication de code entre les PIs.

### 3. State Management

```typescript
const [mappings, setMappings] = useState<ValueMappingData[]>([]);

// React gère automatiquement le re-render
setMappings([...mappings, newMapping]);
```

### 4. Developer Experience

- Hot reload instantané
- Meilleur debugging
- Auto-complétion IDE complète
- Détection d'erreurs avant runtime

### 5. Performance

React Virtual DOM optimise les updates du DOM.

### 6. Maintenabilité

Code plus propre et organisé vs manipulation DOM manuelle.

## Migration des Autres PIs

### ButtonPropertyInspector (index.html)

**Sections à migrer** :
1. DCS Command settings (momentary, switch, increment)
2. Image State Change monitor
3. Title Text Change monitor
4. External windows (ID Lookup, Help, Comms)

**Estimation** : 4-6 heures

### DcsBiosPropertyInspector

**Plus simple** : Un seul bouton "Configure" qui ouvre window.

**Estimation** : 1-2 heures

## Prochaines Étapes

### Phase 1 : Validation (maintenant)

1. ✅ Build `npm run build:encoder`
2. ⏳ Tester avec Stream Deck hardware
3. ⏳ Valider toutes les fonctionnalités
4. ⏳ Corriger bugs éventuels

### Phase 2 : Migration Complète

1. Migrer ButtonPropertyInspector
2. Migrer DcsBiosPropertyInspector
3. Mettre à jour manifest.json
4. Tests complets

### Phase 3 : Cleanup

1. Déprécier anciens HTML PIs
2. Supprimer code legacy
3. Documentation utilisateur

## Troubleshooting

### Build échoue

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build:encoder
```

### WebSocket ne se connecte pas

Vérifier que :
1. Stream Deck est lancé
2. Le plugin est installé
3. La console browser (F12) pour voir les erreurs

### Settings ne se sauvegardent pas

Vérifier :
1. `setSettings()` est appelé correctement
2. Les types correspondent à `StreamDeckTypes.ts`
3. Le format sérialisé est correct

## Ressources

- [Stream Deck SDK Documentation](https://developer.elgato.com/documentation/stream-deck/)
- [React Documentation](https://reactjs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- `/ENCODER_DISPLAY_IMPLEMENTATION.md` - Documentation backend

## Contact

Pour questions sur la migration React, voir :
- `propertyinspector-react/README.md` - Documentation structure
- `ENCODER_DISPLAY_IMPLEMENTATION.md` - Documentation backend
- Code source dans `propertyinspector-react/src/`
