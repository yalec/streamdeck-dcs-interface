# Analyse du flux de communication DCS BIOS Window

## 📋 Flux de communication original (Version Master)

### 1️⃣ Property Inspector HTML/JS Legacy

**Fichier**: `propertyinspector/dcs_bios_prop_inspector.html`
- Charge `dcs_bios_pi.js`
- Affiche un bouton "Configure"

**Fichier**: `propertyinspector/js/dcs_bios_pi.js`
```javascript
function connectElgatoStreamDeckSocket(inPort, inUUID, inMessageType, inApplicationInfo, inActionInfo) {
    const inAction = JSON.parse(inActionInfo);
    window.socketSettings = {
        port: inPort,                          // Ex: 28196
        propertyInspectorUUID: inUUID,         // UUID unique du bouton
        registerEvent: inMessageType,          // "registerPropertyInspector"
        info: inApplicationInfo,               // Infos système
        action: inAction["action"],            // "com.ctytler.dcs.dcs-bios"
    };
    window.settings = inAction["settings"];    // Settings du bouton
}

function handleButtonPress() {
    window.configWindow = window.open("../settingsUI/index.html", "Button Configuration");
}
```

**🔑 Points clés**:
- Stream Deck appelle automatiquement `connectElgatoStreamDeckSocket()`
- Les socketSettings sont stockés dans `window.socketSettings`
- La fenêtre est ouverte avec `window.open()`

### 2️⃣ Fenêtre de configuration (settingsUI/index.html → App.tsx)

**Fichier**: `App.tsx` (maintenant `DCBiosWindow.tsx`)
```typescript
function DCBiosWindow(): JSX.Element {
  const propInspectorWindow = window.opener as Window;
  const socketSettings = propInspectorWindow ? 
      propInspectorWindow.socketSettings : 
      defaultStreamdeckSocketSettings();
  
  const sdApi = useStreamdeckWebsocket(socketSettings);
  // ...
}
```

**🔑 Points clés**:
- Récupère `window.opener.socketSettings` depuis le PI parent
- Utilise ces settings pour créer le WebSocket
- Si window.opener n'existe pas, utilise des valeurs par défaut

### 3️⃣ WebSocket Hook (StreamdeckWebsocket.tsx)

**Fichier**: `api/Streamdeck/StreamdeckWebsocket.tsx`
```typescript
export function useStreamdeckWebsocket(socketSettings: StreamdeckSocketSettings) {
    const websocket = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connexion WebSocket
        websocket.current = new WebSocket("ws://127.0.0.1:" + socketSettings.port)
        
        websocket.current.onopen = () => {
            // 1. S'enregistrer comme Property Inspector
            registerPropertyInspector();
            
            // 2. Demander les settings
            commFns.getGlobalSettings();
            commFns.getSettings();
        }
        
        websocket.current.onmessage = (msg: MessageEvent) => {
            onReceivedMessage(msg.data);
        }
    }, []);

    function registerPropertyInspector() {
        const json = {
            event: socketSettings.registerEvent,  // "registerPropertyInspector"
            uuid: socketSettings.propertyInspectorUUID
        };
        websocket.current?.send(JSON.stringify(json));
    }

    function send(event: string, payload: Record<string, unknown>) {
        const json = {
            event: event,
            context: socketSettings.propertyInspectorUUID,
            ...payload
        };
        websocket.current?.send(JSON.stringify(json));
    }

    function sendToPlugin(payload: Record<string, unknown>) {
        const json = {
            action: socketSettings.action,
            event: "sendToPlugin",
            context: socketSettings.propertyInspectorUUID,
            payload: payload,
        };
        websocket.current?.send(JSON.stringify(json));
    }
}
```

**Messages envoyés au backend C++**:
1. `registerPropertyInspector` avec UUID
2. `getGlobalSettings`
3. `getSettings`
4. `sendToPlugin` pour les commandes spécifiques (requestModuleList, etc.)

**Messages reçus du backend**:
1. `didReceiveSettings` - Settings du bouton
2. `didReceiveGlobalSettings` - Settings globaux
3. `sendToPropertyInspector` avec payload.event:
   - `ModuleList` - Liste des modules DCS
   - `JsonFile` - Fichier JSON de contrôles
   - `DebugDcsGameState` - État du jeu

---

## 🔄 Flux de communication dans la nouvelle architecture React

### 1️⃣ Property Inspector React

**Fichier**: `propertyinspectors/DcsBiosPropertyInspector.tsx`
```typescript
const DcsBiosPropertyInspector: React.FC = () => {
  // usePropertyInspector stocke window.socketSettings
  usePropertyInspector();
  
  const handleConfigureClick = () => {
    if (window.socketSettings) {
      window.configWindow = window.open("../../windows/dcsbios/index.html", "Button Configuration");
    }
  };
}
```

**Fichier**: `hooks/usePropertyInspector.ts`
```typescript
export function usePropertyInspector() {
  useEffect(() => {
    const connectElgatoStreamDeckSocket = (inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo) => {
      const parsedActionInfo = JSON.parse(inActionInfo);
      
      // Stocke dans window comme le legacy
      window.socketSettings = {
        port: inPort,
        propertyInspectorUUID: inPropertyInspectorUUID,
        registerEvent: inRegisterEvent,
        info: inInfo,
        action: parsedActionInfo.action,
      };
      window.settings = parsedActionInfo.payload.settings || {};
      
      // Connexion WebSocket
      const websocket = new WebSocket(`ws://127.0.0.1:${inPort}`);
      websocket.onopen = () => {
        websocket.send(JSON.stringify({
          event: inRegisterEvent,
          uuid: inPropertyInspectorUUID
        }));
      };
    };
    
    // Exposer la fonction pour Stream Deck
    window.connectElgatoStreamDeckSocket = connectElgatoStreamDeckSocket;
  }, []);
}
```

### 2️⃣ Fenêtre DCBiosWindow

**Fichier**: `windows/DCBiosWindow.tsx`
```typescript
function DCBiosWindow(): JSX.Element {
  const propInspectorWindow = window.opener as Window;
  const socketSettings = propInspectorWindow?.socketSettings || defaultStreamdeckSocketSettings();
  const sdApi = useStreamdeckWebsocket(socketSettings);
  // Utilise ButtonConfiguration, IdLookup, RightSidebar, PluginSetup
}
```

---

## 🔍 Points de diagnostic

### ✅ Ce qui devrait fonctionner:

1. **Property Inspector stocke window.socketSettings** ✅
   - Le hook `usePropertyInspector` le fait correctement
   
2. **Fenêtre récupère window.opener.socketSettings** ✅
   - `DCBiosWindow.tsx` le fait comme l'original

3. **WebSocket se connecte au bon port** ✅
   - Utilise `socketSettings.port`

### ❌ Problèmes potentiels à vérifier:

1. **window.opener est-il défini ?**
   ```typescript
   console.log("window.opener exists?", !!window.opener);
   console.log("window.opener.socketSettings?", window.opener?.socketSettings);
   ```

2. **socketSettings contient-il les bonnes valeurs ?**
   ```typescript
   console.log("socketSettings:", socketSettings);
   console.log("port:", socketSettings.port);
   console.log("uuid:", socketSettings.propertyInspectorUUID);
   ```

3. **Le WebSocket se connecte-t-il ?**
   ```typescript
   websocket.current.onopen = () => {
       console.log("✅ WebSocket connected!");
   }
   websocket.current.onerror = (error) => {
       console.error("❌ WebSocket error:", error);
   }
   ```

4. **registerPropertyInspector est-il envoyé ?**
   ```typescript
   console.log("Registering with:", {
       event: socketSettings.registerEvent,
       uuid: socketSettings.propertyInspectorUUID
   });
   ```

5. **Le backend répond-il ?**
   ```typescript
   websocket.current.onmessage = (msg) => {
       console.log("📨 Message from backend:", JSON.parse(msg.data));
   }
   ```

---

## 🐛 Scénarios de problème courants

### Scénario 1: window.opener est null
**Cause**: La fenêtre a été ouverte différemment ou le contexte est perdu
**Solution**: Vérifier que `window.open()` est bien utilisé et que la fenêtre n'est pas ouverte dans un nouvel onglet

### Scénario 2: socketSettings est undefined
**Cause**: Le Property Inspector n'a pas stocké les settings avant d'ouvrir la fenêtre
**Solution**: S'assurer que `connectElgatoStreamDeckSocket` a été appelé

### Scénario 3: WebSocket ne se connecte pas
**Cause**: Le port est incorrect ou le backend n'écoute pas
**Solution**: Vérifier que le backend C++ est lancé et écoute sur le bon port

### Scénario 4: registerPropertyInspector échoue
**Cause**: L'UUID ou l'event name est incorrect
**Solution**: Vérifier que les valeurs correspondent à ce que le backend attend

### Scénario 5: Pas de réponse aux requêtes
**Cause**: Le context/action ne correspond pas au bouton
**Solution**: Vérifier que `socketSettings.action` et `socketSettings.propertyInspectorUUID` sont corrects

---

## 🔧 Debug recommandé

### Dans DCBiosWindow.tsx, ajouter:
```typescript
function DCBiosWindow(): JSX.Element {
  console.log("=== DCBiosWindow Debug ===");
  console.log("window.opener exists:", !!window.opener);
  
  const propInspectorWindow = window.opener as Window;
  console.log("propInspectorWindow:", propInspectorWindow);
  console.log("propInspectorWindow.socketSettings:", propInspectorWindow?.socketSettings);
  
  const socketSettings = propInspectorWindow?.socketSettings || defaultStreamdeckSocketSettings();
  console.log("Using socketSettings:", socketSettings);
  console.log("Port:", socketSettings.port);
  console.log("UUID:", socketSettings.propertyInspectorUUID);
  console.log("Action:", socketSettings.action);
  
  const sdApi = useStreamdeckWebsocket(socketSettings);
  // ...
}
```

### Dans StreamdeckWebsocket.tsx, ajouter:
```typescript
useEffect(() => {
    console.log("=== Creating WebSocket ===");
    console.log("Port:", socketSettings.port);
    console.log("Full URL:", "ws://127.0.0.1:" + socketSettings.port);
    
    websocket.current = new WebSocket("ws://127.0.0.1:" + socketSettings.port)
    
    websocket.current.onopen = () => {
        console.log("✅ WebSocket CONNECTED");
        console.log("Registering with:", {
            event: socketSettings.registerEvent,
            uuid: socketSettings.propertyInspectorUUID
        });
        registerPropertyInspector();
        commFns.getGlobalSettings();
        commFns.getSettings();
    }
    
    websocket.current.onmessage = (msg: MessageEvent) => {
        console.log("📨 Received message:", msg.data);
        onReceivedMessage(msg.data);
    }
    
    websocket.current.onerror = (error) => {
        console.error("❌ WebSocket ERROR:", error);
    }
    
    websocket.current.onclose = (event) => {
        console.warn("🔌 WebSocket CLOSED:", event.code, event.reason);
    }
}, []);
```

---

## 📝 Prochaines étapes

1. Ajouter les logs de debug ci-dessus
2. Ouvrir la console DevTools (F12) dans la fenêtre DCBiosWindow
3. Vérifier chaque étape du flux
4. Identifier où exactement la communication échoue
5. Comparer avec les logs du Property Inspector (également avec F12)
