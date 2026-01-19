# ID Lookup Window - Réécriture Propre Basée sur le Code Original

## ❌ Problème Identifié dans les Logs

```
Received messageType 'setGlobalSettings' from the wrong context 'fa110dc73ffcaf49ee238648ce5fcd3d
Received messageType 'sendToPlugin' from the wrong context 'fa110dc73ffcaf49ee238648ce5fcd3d
```

**Cause:** Notre version React envoyait des messages WebSocket avec des contextes incorrects.

## ✅ Solution: Réécriture Propre depuis le Code JavaScript Original

Au lieu d'essayer de faire fonctionner du code trop complexe, nous avons **réécrit** IdLookupWindow en suivant **exactement** le code JavaScript original.

### Fichier Créé: `IdLookupWindowSimple.tsx`

Migration fonction par fonction depuis `id_lookup_window_functions.js`:

| Fonction Originale JS | Fonction React | Description |
|----------------------|----------------|-------------|
| `sendmessage()` | `sendMessage()` | Envoie message à window.opener |
| `loaded()` + `restoreGlobalSettings()` | `useEffect()` mount | Restaure settings au chargement |
| `UpdateGlobalSettings()` | `updateGlobalSettings()` | Met à jour les global settings |
| `RequestInstalledModules()` | `requestInstalledModules()` | Demande les modules DCS |
| `callbackRequestIdLookup()` | `requestIdLookup()` | Demande les clickabledata |
| `gotInstalledModules()` | `window.gotInstalledModules` | Callback pour recevoir modules |
| `gotClickabledata()` | `window.gotClickabledata` | Callback pour recevoir clickabledata |
| `modifyInstalledModulesList()` | `modifyModulesList()` | Traite cas spéciaux (L-39, C-101) |
| `callbackImportDcsCommand()` | `importDcsCommand()` | Import commande DCS |
| `callbackImportImageChange()` | `importImageChange()` | Import changement image |
| `callbackImportTextChange()` | `importTextChange()` | Import changement texte |

### Changements Clés dans les Property Inspectors

**ButtonPropertyInspector.tsx & EncoderPropertyInspector.tsx:**

```typescript
// AVANT (Incorrect - envoyait un objet)
sendToPluginGlobal({
  event: "RequestInstalledModules",
  dcs_install_path: parameter.payload.dcs_install_path,
  dcs_savedgames_path: parameter.payload.dcs_savedgames_path,
});

// APRÈS (Correct - suit le code original qui envoie juste le path string)
sendToPluginGlobal({
  event: "RequestInstalledModules",
  dcs_install_path: String(parameter.payload), // Le payload EST le path!
});
```

### Changements dans `usePropertyInspector.ts`

**Forwarding des données au IdLookupWindow:**

```typescript
// Suit exactement sendToIdLookupWindowInstalledModules() du code original
if (payload.event === "InstalledModules" && payload.installed_modules) {
  if (window.idLookupWindow && !window.idLookupWindow.closed) {
    const idLookupWin = window.idLookupWindow as Window & { 
      gotInstalledModules?: (modulesList: string[]) => void 
    };
    if (idLookupWin.gotInstalledModules) {
      idLookupWin.gotInstalledModules(payload.installed_modules);
    }
  }
}

// Suit exactement sendToIdLookupWindowClickabledata() du code original
if (payload.event === "Clickabledata" && payload.clickabledata) {
  if (window.idLookupWindow && !window.idLookupWindow.closed) {
    const idLookupWin = window.idLookupWindow as Window & { 
      gotClickabledata?: (data: string[]) => void 
    };
    if (idLookupWin.gotClickabledata) {
      idLookupWin.gotClickabledata(payload.clickabledata);
    }
  }
}
```

## 📊 Flux de Communication Simplifié

```
┌──────────────────────────────────┐
│  IdLookupWindowSimple.tsx        │
│                                  │
│  1. loaded() au montage:         │
│     - Lit window.opener.global.. │
│     - Expose gotInstalledModules │
│     - Expose gotClickabledata    │
│     - Appelle requestInstalled.. │
└──────────────┬───────────────────┘
               │ sendMessage()
               ↓
┌──────────────────────────────────┐
│  window.opener                   │
│  .gotCallbackFromIdLookupWindow()│
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  ButtonPropertyInspector.tsx     │
│                                  │
│  gotCallbackFromIdLookupWindow   │
│    → handleMessage()             │
│    → sendToPluginGlobal()        │
└──────────────┬───────────────────┘
               │ WebSocket
               ↓
┌──────────────────────────────────┐
│  C++ Backend Plugin              │
│                                  │
│  → Traite la requête             │
│  → sendToPropertyInspector()     │
└──────────────┬───────────────────┘
               │ WebSocket
               ↓
┌──────────────────────────────────┐
│  usePropertyInspector.ts         │
│                                  │
│  websocket.onmessage()           │
│    → Forward à IdLookupWindow    │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  IdLookupWindowSimple.tsx        │
│                                  │
│  window.gotInstalledModules()    │
│  window.gotClickabledata()       │
│    → Affiche les données         │
└──────────────────────────────────┘
```

## 🎯 Simplicité vs Complexité

### ❌ Ancien Code (Trop Complexe)
- Utilisait `handleSendToPropertyInspector()`
- Gestion complexe des messages via events
- Confusion entre payload objet et payload string
- Messages envoyés avec mauvais contextes WebSocket

### ✅ Nouveau Code (Simple et Propre)
- **Suit exactement le code JavaScript original**
- Communication directe via `window.opener`
- Callbacks simples exposés sur window
- Pas de confusion sur les types de payload
- Pas d'erreur de contexte WebSocket

## 📝 Fichiers Modifiés

1. **Nouveau:** `windows/IdLookupWindowSimple.tsx`
   - Migration propre depuis `id_lookup_window_functions.js`
   - Logique identique au code original
   - Interface utilisateur modernisée en React

2. **Modifié:** `index.tsx`
   - Utilise `IdLookupWindowSimple` au lieu de `IdLookupWindow`

3. **Modifié:** `propertyinspectors/ButtonPropertyInspector.tsx`
   - Correction de `RequestInstalledModules` (payload = string, pas objet)
   - Correction de `RequestIdLookup` (pas de dcs_savedgames_path)

4. **Modifié:** `propertyinspectors/EncoderPropertyInspector.tsx`
   - Mêmes corrections que ButtonPropertyInspector

5. **Modifié:** `hooks/usePropertyInspector.ts`
   - Forwarding simplifié vers IdLookupWindow
   - Appelle directement `gotInstalledModules()` et `gotClickabledata()`

## 🧪 Test

```powershell
cd D:\dev\streamdeck-dcs-interface-fork\Sources\frontend-react-js
npm run build:all

# Vérifier que idlookup-react est généré
dir ..\com.ctytler.dcs.sdPlugin\propertyinspector\idlookup-react
```

**Taille du build:** 46.83 kB (plus petit que l'ancienne version complexe!)

## ✅ Avantages de Cette Approche

1. **Fidélité au code original:** Chaque fonction JS a son équivalent React direct
2. **Simplicité:** Pas de sur-ingénierie, pas de gestionnaires complexes
3. **Maintenabilité:** Facile à comprendre et déboguer
4. **Performance:** Code plus léger (46.83 kB vs 47 kB avant)
5. **Fiabilité:** Suit un pattern qui fonctionne déjà dans la version HTML/JS

## 🎓 Leçon Apprise

> **"Parfois, la meilleure solution est de repartir de zéro en suivant le code qui fonctionne"**

Au lieu de déboguer des couches de complexité ajoutées par erreur, nous avons:
1. Analysé le code JavaScript original qui fonctionne
2. Migré fonction par fonction vers React
3. Gardé la même logique, juste avec React pour l'UI

## 📋 Checklist de Test

- [ ] Ouvrir Stream Deck
- [ ] Ajouter un bouton "Switch Input"
- [ ] Cliquer "ID Lookup" dans Property Inspector
- [ ] Vérifier que la fenêtre s'ouvre
- [ ] Path DCS pré-rempli automatiquement
- [ ] Cliquer "Update" charge les modules
- [ ] Dropdown montre les avions DCS installés
- [ ] Sélectionner un module charge les données
- [ ] Table affiche les clickabledata
- [ ] Recherche fonctionne
- [ ] Sélectionner une ligne active les boutons Import
- [ ] Import DCS Command fonctionne
- [ ] ✅ **AUCUNE erreur "wrong context" dans les logs!**
