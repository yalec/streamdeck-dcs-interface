# Analyse de la Fenêtre ID Lookup

## État Actuel

### Architecture Originale (HTML/JS)
Référence: `D:\dev\streamdeck-dcs-interface-master\Sources\com.ctytler.dcs.sdPlugin\`

**Fichiers principaux:**
- `propertyinspector/id_lookup_window.html` - Interface utilisateur
- `propertyinspector/js/id_lookup_window_functions.js` - Logique métier
- `propertyinspector/js/external_windows_functions.js` - Communication inter-fenêtres

**Mécanisme de Communication:**
```javascript
// Ouverture depuis Property Inspector
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

### Architecture React (Actuelle)
Référence: `D:\dev\streamdeck-dcs-interface-fork\Sources\frontend-react-js\`

**Fichiers principaux:**
- `src/windows/IdLookupWindow.tsx` - Composant React ✅
- `src/propertyinspectors/ButtonPropertyInspector.tsx` - Ouvre la fenêtre ✅
- `src/propertyinspectors/EncoderPropertyInspector.tsx` - Ouvre la fenêtre ✅

**Problème Identifié:**
❌ **Pas de build HTML standalone pour IdLookupWindow**
- Le composant React existe mais n'est pas compilé séparément
- L'ancien `id_lookup_window.html` (HTML/JS) est toujours présent
- Les Property Inspectors essaient d'ouvrir l'ancien fichier HTML

## Solution Implémentée

### 1. Scripts de Build Ajoutés
Mis à jour `package.json` avec:
```json
"build:idlookup-window": "set \"BUILD_PATH=../com.ctytler.dcs.sdPlugin/propertyinspector/idlookup-react\" && set \"REACT_APP_WINDOW_TYPE=idlookup\" && react-scripts build",
"build:comms-window": "set \"BUILD_PATH=../com.ctytler.dcs.sdPlugin/propertyinspector/comms-react\" && set \"REACT_APP_WINDOW_TYPE=comms\" && react-scripts build",
"build:all": "... && npm run build:idlookup-window && npm run build:comms-window"
```

### 2. Routing React Amélioré
Mis à jour `src/index.tsx` pour supporter `REACT_APP_WINDOW_TYPE`:
```typescript
const windowBuildType = process.env.REACT_APP_WINDOW_TYPE;

if (windowBuildType === "idlookup" || windowType === "idlookup") {
  Component = IdLookupWindow;
} else if (windowBuildType === "comms" || windowType === "comms") {
  Component = CommsWindow;
}
```

### 3. Chemins Mis à Jour
**ButtonPropertyInspector.tsx** et **EncoderPropertyInspector.tsx**:
```typescript
const urls = {
  idLookup: "../../propertyinspector/idlookup-react/index.html",  // ✅ Nouveau
  help: "../../helpDocs/helpWindow.html",
  comms: "../../propertyinspector/comms-react/index.html",        // ✅ Nouveau
};
```

## Fonctionnalités à Vérifier

### Communication Inter-Fenêtres
- ✅ `window.opener.gotCallbackFromIdLookupWindow()` - Existe dans ButtonPropertyInspector.tsx
- ✅ `window.handleSendToPropertyInspector()` - Défini dans IdLookupWindow.tsx
- ⚠️ **À TESTER**: Les messages passent-ils correctement?

### Flux de Données
1. User clique "ID Lookup" → `openExternalWindow("idLookup")`
2. Nouvelle fenêtre s'ouvre avec `idlookup-react/index.html`
3. IdLookupWindow.tsx monte et lit `window.opener.global_settings`
4. IdLookupWindow envoie `RequestInstalledModules` via `gotCallbackFromIdLookupWindow`
5. Property Inspector reçoit via `gotCallbackFromIdLookupWindow()`
6. Property Inspector envoie au plugin C++ via WebSocket
7. Plugin C++ répond avec `InstalledModules` via `sendToPropertyInspector`
8. Property Inspector forward à IdLookupWindow via `window.idLookupWindow.handleSendToPropertyInspector()`

### Fonctionnalités Principales
- [ ] Affichage des modules installés
- [ ] Recherche dans les données clickables
- [ ] Import de commandes DCS
- [ ] Import de changements d'image
- [ ] Import de changements de texte
- [ ] Messages de debug visibles

## Prochaines Étapes

### 1. Build et Test
```powershell
cd Sources\frontend-react-js
npm install
npm run build:idlookup-window
npm run build:comms-window
```

### 2. Test dans Stream Deck
```powershell
.\Tools\build_plugin_cmake.bat -debug
```

### 3. Vérification
- [ ] La fenêtre ID Lookup s'ouvre correctement
- [ ] Les modules DCS sont listés
- [ ] La recherche fonctionne
- [ ] L'import de commandes fonctionne
- [ ] Les logs de debug s'affichent

### 4. Debug
Si la fenêtre ne s'ouvre pas:
- Vérifier que `idlookup-react/index.html` existe après le build
- Vérifier la console JavaScript (F12) pour les erreurs
- Vérifier que `window.opener` existe
- Vérifier que `window.opener.gotCallbackFromIdLookupWindow` est défini
- Vérifier les logs dans IdLookupWindow (section Debug Messages)

## Comparaison HTML vs React

### Avantages React
- ✅ TypeScript pour la sécurité des types
- ✅ State management avec React hooks
- ✅ Composants réutilisables
- ✅ Messages de debug intégrés
- ✅ Meilleure structure de code

### Compatibilité
- ✅ Même API de communication (`window.opener`)
- ✅ Mêmes événements
- ✅ Même structure de payload
- ✅ Compatible avec le plugin C++ existant

## Références

### Documentation Originale
- `D:\dev\streamdeck-dcs-interface-master\` - Version HTML/JS de référence
- `external_windows_functions.js` - Logique de communication originale
- `id_lookup_window_functions.js` - Logique métier originale

### Documentation React
- [REACT_MIGRATION.md](REACT_MIGRATION.md) - Guide de migration
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Résumé de la migration
- [frontend-react-js/ARCHITECTURE.md](Sources/frontend-react-js/ARCHITECTURE.md) - Architecture React

### Stream Deck CLI
```powershell
# Liens le plugin pour le développement
streamdeck link Sources\com.ctytler.dcs.sdPlugin

# Active le mode développeur (logs détaillés)
streamdeck dev

# Redémarre le plugin
streamdeck restart com.ctytler.dcs
```
