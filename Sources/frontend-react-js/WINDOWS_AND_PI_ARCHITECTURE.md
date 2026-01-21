# Architecture React - Organisation des Fenêtres et Property Inspectors

## Vue d'ensemble

Cette documentation explique la nouvelle organisation du code React pour le plugin Stream Deck DCS Interface.

## Structure des dossiers

### Sources/frontend-react-js/src/

Le code source React est organisé comme suit :

```
src/
├── windows/                    # Fenêtres externes (standalone windows)
│   ├── IdLookupWindow.tsx     # Fenêtre de recherche d'ID DCS-BIOS
│   ├── CommsWindow.tsx        # Fenêtre de configuration des communications
│   └── DCBiosWindow.tsx       # Fenêtre de configuration DCS-BIOS (remplace App.tsx)
│
├── propertyinspectors/        # Property Inspectors intégrés dans Stream Deck
│   ├── EncoderPropertyInspector.tsx    # PI pour les encodeurs
│   ├── ButtonPropertyInspector.tsx     # PI pour les boutons
│   └── DcsBiosPropertyInspector.tsx    # PI pour les commandes DCS-BIOS
│
├── areas/                     # Composants réutilisables (zones d'interface)
├── components/                # Composants génériques
├── forms/                     # Composants de formulaires
├── hooks/                     # Hooks React personnalisés
├── modals/                    # Fenêtres modales
├── api/                       # API et communication WebSocket
└── types/                     # Définitions TypeScript
```

### Sources/com.ctytler.dcs.sdPlugin/

Le plugin compilé est organisé comme suit :

```
com.ctytler.dcs.sdPlugin/
├── windows/                   # Fenêtres externes (standalone windows)
│   ├── idlookup/             # Build de IdLookupWindow
│   ├── comms/                # Build de CommsWindow
│   └── dcsbios/              # Build de DCBiosWindow (remplace settingsUI)
│
├── propertyinspector/        # Property Inspectors SDK Stream Deck
│   ├── encoder-react/        # Build de EncoderPropertyInspector
│   ├── button-react/         # Build de ButtonPropertyInspector
│   ├── dcsbios-react/        # Build de DcsBiosPropertyInspector
│   └── js/                   # Legacy JavaScript (à migrer)
│
└── [autres dossiers du plugin]
```

## Distinction Fenêtres vs Property Inspectors

### Property Inspectors (propertyinspector/)

Les **Property Inspectors** sont des interfaces **intégrées dans Stream Deck** qui apparaissent dans le panneau de droite quand vous sélectionnez un bouton/encodeur dans l'application Stream Deck.

- **Encoder PI** : Configuration des encodeurs rotatifs
- **Button PI** : Configuration des boutons standard
- **DCS-BIOS PI** : Configuration simplifiée pour les commandes DCS-BIOS

Ils communiquent avec le backend C++ via WebSocket et le protocole Stream Deck SDK.

### Windows (windows/)

Les **Windows** sont des **fenêtres externes standalone** qui s'ouvrent dans des fenêtres navigateur séparées. Elles offrent plus d'espace et de fonctionnalités que les Property Inspectors.

- **IdLookup Window** : Recherche et sélection d'IDs DCS-BIOS avec accès à la documentation complète
- **Comms Window** : Configuration avancée des paramètres de communication (IP, ports, etc.)
- **DCBios Window** : Configuration complète des boutons avec drag & drop, preview, etc.

Elles sont ouvertes via `window.open()` depuis les Property Inspectors.

## Commandes de Build

### Build individuel

```bash
# Property Inspectors
npm run build:encoder-pi
npm run build:button-pi
npm run build:dcsbios-pi

# Windows
npm run build:idlookup-window
npm run build:comms-window
npm run build:dcsbios-window
```

### Build complet

```bash
npm run build:all
```

Cette commande construit tous les Property Inspectors et toutes les Windows en une seule fois.

## Migration depuis l'ancienne structure

### Changements effectués

1. **Création de DCBiosWindow.tsx** : Le contenu de `App.tsx` a été migré vers `windows/DCBiosWindow.tsx`
2. **Réorganisation des dossiers** :
   - `settingsUI/` → `windows/dcsbios/`
   - `propertyinspector/idlookup-react/` → `windows/idlookup/`
   - `propertyinspector/comms-react/` → `windows/comms/`
3. **Mise à jour des chemins** : Tous les chemins dans le code ont été mis à jour pour pointer vers les nouveaux emplacements

### Fichiers Legacy

Les fichiers suivants dans `propertyinspector/` sont legacy et doivent être migrés ou supprimés :

- `propertyinspector/idlookup-react/` (ancien emplacement, peut être supprimé après vérification)
- `propertyinspector/comms-react/` (ancien emplacement, peut être supprimé après vérification)
- `settingsUI/` (ancien emplacement, peut être supprimé après vérification)
- `propertyinspector/js/` (JavaScript legacy, à migrer vers React)
- `propertyinspector/*.html` (HTML legacy, à supprimer une fois la migration complète)

### App.tsx

`App.tsx` reste pour compatibilité legacy mais n'est plus utilisé dans les nouveaux builds. Il peut être marqué comme deprecated et supprimé une fois la migration complète terminée.

## Prochaines étapes

1. **Tester les fenêtres** : Vérifier que toutes les fenêtres s'ouvrent correctement avec les nouveaux chemins
2. **Nettoyer les anciens dossiers** : Supprimer `settingsUI/`, `propertyinspector/idlookup-react/`, `propertyinspector/comms-react/` après vérification
3. **Migrer le JavaScript legacy** : Convertir les fichiers dans `propertyinspector/js/` en React
4. **Supprimer les HTML legacy** : Une fois tous les PI migrés, supprimer les fichiers HTML legacy
5. **Mettre à jour la documentation** : Documenter chaque fenêtre et PI individuellement

## Avantages de cette architecture

✅ **Séparation claire** : Property Inspectors SDK vs Fenêtres externes
✅ **Structure cohérente** : Même pattern pour toutes les fenêtres (IdLookup, Comms, DCBios)
✅ **Maintenance facilitée** : Code organisé de façon logique
✅ **Évolutivité** : Facile d'ajouter de nouvelles fenêtres ou PIs
✅ **Build optimisé** : Chaque composant a son propre build avec les bonnes variables d'environnement
