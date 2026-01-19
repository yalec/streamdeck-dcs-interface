# Fix: Fenêtre ID Lookup - Récupération des Global Settings

## ❌ Problème Identifié

La fenêtre ID Lookup ne chargeait pas:
- La liste des modules d'avion installés
- Les données clickables

**Cause racine:** Les `globalSettings` n'étaient jamais récupérés depuis Stream Deck.

## 🔍 Analyse

### Flux Attendu
```
1. Property Inspector démarre
2. Se connecte à Stream Deck WebSocket
3. Envoie getGlobalSettings
4. Reçoit didReceiveGlobalSettings
5. Stocke dans window.global_settings
6. IdLookupWindow lit window.global_settings (dcs_install_path, etc.)
7. Envoie RequestInstalledModules avec ces chemins
8. Backend C++ répond avec les modules
```

### Ce qui manquait
- ❌ **Pas de `getGlobalSettings`** envoyé au démarrage
- ❌ **Pas de gestion de `didReceiveGlobalSettings`**
- ❌ **Pas de fonction `setGlobalSettings` exposée**
- ❌ UpdateGlobalSettings utilisait `sendToPlugin` au lieu de `setGlobalSettings` WebSocket

## ✅ Corrections Appliquées

### 1. Hook `usePropertyInspector.ts`

#### A. Récupération des Global Settings au démarrage
```typescript
websocket.onopen = () => {
  // ... register PI ...
  setConnected(true);
  
  // ✅ AJOUTÉ: Request global settings immediately
  const getGlobalSettingsJson = {
    event: "getGlobalSettings",
    context: inPropertyInspectorUUID
  };
  websocket.send(JSON.stringify(getGlobalSettingsJson));
};
```

#### B. Gestion de la réponse
```typescript
websocket.onmessage = (evt) => {
  const jsonObj = JSON.parse(evt.data);
  
  // ✅ AJOUTÉ: Handle didReceiveGlobalSettings
  if (jsonObj.event === "didReceiveGlobalSettings") {
    if (jsonObj.payload && jsonObj.payload.settings) {
      console.log("Received global settings:", jsonObj.payload.settings);
      // Update window.global_settings for external windows
      window.global_settings = {
        ...window.global_settings,
        ...jsonObj.payload.settings
      };
      console.log("Updated window.global_settings:", window.global_settings);
    }
  }
  // ... autres événements ...
};
```

#### C. Fonction setGlobalSettings
```typescript
// ✅ AJOUTÉ: Set global settings
const setGlobalSettings = useCallback((newSettings: Record<string, unknown>) => {
  if (!websocketRef.current || !connected) {
    console.error("setGlobalSettings: websocket not connected");
    return;
  }

  const json = {
    event: "setGlobalSettings",
    context: context,
    payload: newSettings
  };
  console.log("setGlobalSettings:", newSettings);
  websocketRef.current.send(JSON.stringify(json));
  
  // Also update window.global_settings immediately
  window.global_settings = {
    ...window.global_settings,
    ...newSettings
  };
}, [connected, context]);

return {
  // ... autres retours ...
  setGlobalSettings  // ✅ AJOUTÉ
};
```

### 2. ButtonPropertyInspector.tsx

```typescript
// ✅ Ajout de setGlobalSettings au destructuring
const { ..., setGlobalSettings, ... } = usePropertyInspector<ButtonSettings>();

// ✅ Utilisation correcte dans handleMessage
if (parameter.event === "UpdateGlobalSettings") {
  console.log("UpdateGlobalSettings received:", parameter.payload);
  setGlobalSettings(parameter.payload as Record<string, unknown>);
}
```

### 3. EncoderPropertyInspector.tsx

Même changement que ButtonPropertyInspector.

## 🧪 Comment Tester

### 1. Rebuild du Plugin
```powershell
cd D:\dev\streamdeck-dcs-interface-fork\Sources\frontend-react-js
npm run build:all
```

### 2. Installer/Redémarrer le Plugin
```powershell
# Désinstaller l'ancien si nécessaire
streamdeck stop com.ctytler.dcs

# Installer le nouveau
cd D:\dev\streamdeck-dcs-interface-fork
.\Tools\build_plugin_cmake.bat -debug
```

### 3. Test de la Fenêtre ID Lookup

1. Ouvrir Stream Deck
2. Ajouter un bouton "Switch Input"
3. Ouvrir Property Inspector
4. Cliquer sur "ID Lookup"

**Vérifications avec Console (F12 sur Property Inspector):**
```javascript
// Doit afficher au démarrage:
"Received global settings: {dcs_install_path: '...', ...}"
"Updated window.global_settings: {...}"

// Dans IdLookupWindow, section Debug devrait montrer:
"✓ Connected to Property Inspector"
"📤 Sending RequestInstalledModules..."
"✓ Request sent successfully"
// Puis après réponse du backend:
"✓ Received X modules from DCS"
```

### 4. Vérifications dans IdLookupWindow

- [ ] La section "Debug Messages" en bas affiche les logs
- [ ] Le path DCS est pré-rempli
- [ ] Cliquer "Update" charge les modules
- [ ] Le dropdown "Select Module" est populé avec les avions
- [ ] Sélectionner un module charge les données clickables
- [ ] La recherche fonctionne dans le tableau

## 📊 Flux Complet Corrigé

```
┌─────────────────────────────────────┐
│ ButtonPropertyInspector Démarrage   │
│                                     │
│ usePropertyInspector.useEffect()    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ WebSocket Connection                │
│                                     │
│ websocket.onopen()                  │
│  ├─ send(registerPropertyInspector) │
│  └─ send(getGlobalSettings) ✅      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Stream Deck                         │
│                                     │
│ → didReceiveGlobalSettings ✅       │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ usePropertyInspector                │
│                                     │
│ websocket.onmessage()               │
│  → window.global_settings = {...} ✅│
└──────────────┬──────────────────────┘
               │
               ↓ User clicks "ID Lookup"
┌─────────────────────────────────────┐
│ IdLookupWindow Opens                │
│                                     │
│ useEffect() on mount:               │
│  ├─ Read window.opener.global_set.. │
│  ├─ setDcsInstallPath(...) ✅       │
│  ├─ setDcsSavedGamesPath(...) ✅    │
│  └─ requestInstalledModules() ✅    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ window.opener.gotCallback...()      │
│                                     │
│ Event: RequestInstalledModules      │
│ Payload: { dcs_install_path, ... } ✅│
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ ButtonPropertyInspector             │
│                                     │
│ handleMessage()                     │
│  → sendToPluginGlobal(...)          │
└──────────────┬──────────────────────┘
               │ WebSocket
               ↓
┌─────────────────────────────────────┐
│ C++ Plugin Backend                  │
│                                     │
│ handle_RequestInstalledModules()    │
│  → Scan DCS directory               │
│  → sendToPropertyInspector()        │
└──────────────┬──────────────────────┘
               │ WebSocket
               ↓
┌─────────────────────────────────────┐
│ usePropertyInspector                │
│                                     │
│ websocket.onmessage()               │
│  → Forward to window.idLookupWindow │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ IdLookupWindow                      │
│                                     │
│ window.handleSendToPropertyInsp...()│
│  → setModules([...]) ✅             │
│  → Populate dropdown ✅             │
└─────────────────────────────────────┘
```

## 🎯 Résultat Attendu

Après ces corrections:
- ✅ IdLookupWindow reçoit les global_settings dès l'ouverture
- ✅ Les chemins DCS sont pré-remplis
- ✅ RequestInstalledModules est envoyé avec les bons chemins
- ✅ Le backend C++ répond avec les modules
- ✅ Les modules s'affichent dans le dropdown
- ✅ L'utilisateur peut chercher et importer des commandes DCS

## 📝 Fichiers Modifiés

- [x] `hooks/usePropertyInspector.ts`
  - Ajout de `getGlobalSettings` au démarrage
  - Ajout de gestion de `didReceiveGlobalSettings`
  - Ajout de fonction `setGlobalSettings()`
  
- [x] `propertyinspectors/ButtonPropertyInspector.tsx`
  - Utilisation de `setGlobalSettings` pour UpdateGlobalSettings
  
- [x] `propertyinspectors/EncoderPropertyInspector.tsx`
  - Utilisation de `setGlobalSettings` pour UpdateGlobalSettings

## 🐛 Debug

Si les modules n'apparaissent toujours pas:

### 1. Vérifier les Global Settings
```javascript
// Dans la console du Property Inspector
console.log(window.global_settings);
// Devrait montrer: { dcs_install_path: "...", dcs_savedgames_path: "...", ... }
```

### 2. Vérifier la Communication WebSocket
```javascript
// Dans la console du Property Inspector, activer les logs
localStorage.debug = '*';
// Puis recharger
```

### 3. Vérifier IdLookupWindow
- Ouvrir F12 sur la fenêtre IdLookupWindow
- Regarder la section "Debug Messages" en bas
- Chaque étape devrait être loggée

### 4. Vérifier le Backend C++
```powershell
# Avec Stream Deck CLI en mode dev
streamdeck dev
streamdeck restart com.ctytler.dcs

# Regarder les logs du plugin dans le Stream Deck log viewer
```

## ✅ Checklist de Test

- [ ] Build réussi sans erreurs
- [ ] Property Inspector charge les global_settings au démarrage
- [ ] `window.global_settings` est populé avec des valeurs réelles
- [ ] IdLookupWindow s'ouvre sans erreur
- [ ] IdLookupWindow lit `window.opener.global_settings`
- [ ] RequestInstalledModules est envoyé avec les bons chemins
- [ ] Le backend C++ répond
- [ ] Les modules apparaissent dans le dropdown
- [ ] Sélectionner un module charge les clickables
- [ ] La recherche fonctionne
- [ ] L'import de commandes fonctionne
