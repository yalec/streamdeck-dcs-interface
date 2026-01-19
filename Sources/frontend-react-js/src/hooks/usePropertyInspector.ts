import { useEffect, useState, useCallback, useRef } from "react";
import { ActionInfo, SocketSettings } from "../types/StreamDeckTypes";

/**
 * Simplified Stream Deck Property Inspector hook
 * Works with the existing Stream Deck SDK connection
 */

interface UsePropertyInspectorResult<T> {
  connected: boolean;
  settings: T;
  actionInfo?: ActionInfo;
  action: string;
  context: string;
  setSettings: (newSettings: Partial<T>) => void;
  sendToPlugin: (payload: Record<string, unknown>) => void;
  sendToPluginGlobal: (payload: Record<string, unknown>) => void;
  setGlobalSettings: (newSettings: Record<string, unknown>) => void;
}

export function usePropertyInspector<T extends Record<string, unknown>>(): UsePropertyInspectorResult<T> {
  const [connected, setConnected] = useState(false);
  const [settings, setSettingsState] = useState<T>({} as T);
  const [actionInfo, setActionInfo] = useState<ActionInfo | null>(null);
  const [context, setContext] = useState("");
  const [actionUUID, setActionUUID] = useState("");
  const [propertyInspectorUUID, setPropertyInspectorUUID] = useState("");
  
  const websocketRef = useRef<WebSocket | null>(null);

  // Initialize connection with Stream Deck
  useEffect(() => {
    const connectElgatoStreamDeckSocket = (
      inPort: string,
      inPropertyInspectorUUID: string,
      inRegisterEvent: string,
      inInfo: string,
      inActionInfo: string
    ) => {
      // Parse connection info
      const parsedActionInfo = JSON.parse(inActionInfo);
      setContext(parsedActionInfo.context);
      setActionUUID(parsedActionInfo.action);
      setPropertyInspectorUUID(inPropertyInspectorUUID); // Store PI UUID for global messages
      setSettingsState(parsedActionInfo.payload.settings || {});
      setActionInfo(parsedActionInfo);

      // Store in window for compatibility with settingsUI popup
      // This mimics dcs_bios_pi.js behavior
      window.socketSettings = {
        port: inPort,
        propertyInspectorUUID: inPropertyInspectorUUID,
        registerEvent: inRegisterEvent,
        info: inInfo,
        action: parsedActionInfo.action,
      } as SocketSettings;
      window.settings = parsedActionInfo.payload.settings || {};

      // Connect WebSocket
      const websocket = new WebSocket(`ws://127.0.0.1:${inPort}`);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        const json = {
          event: inRegisterEvent,
          uuid: inPropertyInspectorUUID
        };
        websocket.send(JSON.stringify(json));
        setConnected(true);
        
        // Request global settings immediately after connecting
        const getGlobalSettingsJson = {
          event: "getGlobalSettings",
          context: inPropertyInspectorUUID
        };
        websocket.send(JSON.stringify(getGlobalSettingsJson));
      };

      websocket.onmessage = (evt) => {
        try {
          const jsonObj = JSON.parse(evt.data);
          
          if (jsonObj.event === "didReceiveSettings") {
            if (jsonObj.payload && jsonObj.payload.settings) {
              setSettingsState(jsonObj.payload.settings);
            }
          }

          // Handle didReceiveGlobalSettings
          if (jsonObj.event === "didReceiveGlobalSettings") {
            if (jsonObj.payload && jsonObj.payload.settings) {
              // Update window.global_settings for external windows
              window.global_settings = {
                ...window.global_settings,
                ...jsonObj.payload.settings
              };
            }
          }

          // Handle sendToPropertyInspector for external window communication
          if (jsonObj.event === "sendToPropertyInspector") {
            const payload = jsonObj.payload;
            
            // Forward InstalledModules and Clickabledata to IdLookupWindow
            // Suit exactement le pattern de sendToIdLookupWindowInstalledModules() et sendToIdLookupWindowClickabledata()
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

            // Forward DebugDcsGameState to CommsWindow
            // Suit exactement le pattern de sendToCommsWindowDcsGameState()
            if (payload.event === "DebugDcsGameState") {
              if (window.commsWindow && !window.commsWindow.closed) {
                const commsWin = window.commsWindow as Window & { 
                  gotDcsGameState?: (gameState: Record<string, unknown> | null) => void 
                };
                if (commsWin.gotDcsGameState) {
                  commsWin.gotDcsGameState(payload.current_game_state || null);
                }
              }
            }

            // Other sendToPropertyInspector events are handled by the Property Inspector itself
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      websocket.onclose = () => {
        setConnected(false);
      };
    };

    // Expose globally for Stream Deck
    window.connectElgatoStreamDeckSocket = connectElgatoStreamDeckSocket;

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Set settings
  const setSettings = useCallback((newSettings: Partial<T>) => {
    if (!websocketRef.current || !connected) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettingsState(updatedSettings);

    const json = {
      event: "setSettings",
      context: context,
      payload: updatedSettings
    };
    websocketRef.current.send(JSON.stringify(json));
  }, [settings, connected, context]);

  // Send to plugin
  const sendToPlugin = useCallback((payload: Record<string, unknown>) => {
    if (!websocketRef.current || !connected) {
      console.error("sendToPlugin: websocket not connected");
      return;
    }

    const json = {
      action: actionUUID,
      event: "sendToPlugin",
      context: context,
      payload: payload
    };
    websocketRef.current.send(JSON.stringify(json));
  }, [connected, context, actionUUID]);

  // Send to plugin for global operations (RequestInstalledModules, RequestIdLookup)
  // Uses Property Inspector UUID instead of action context - matches original JavaScript behavior
  const sendToPluginGlobal = useCallback((payload: Record<string, unknown>) => {
    if (!websocketRef.current || !connected) {
      console.error("sendToPluginGlobal: websocket not connected");
      return;
    }

    // Use Property Inspector UUID (not action context) for global operations
    // This matches the original JavaScript: $SD.uuid (Property Inspector UUID)
    const json = {
      action: actionUUID || "com.ctytler.dcs.exportscript",
      event: "sendToPlugin",
      context: propertyInspectorUUID, // Use PI UUID instead of action context!
      payload: payload
    };
    websocketRef.current.send(JSON.stringify(json));
  }, [connected, propertyInspectorUUID, actionUUID]);

  // Set global settings
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
    websocketRef.current.send(JSON.stringify(json));
    
    // Also update window.global_settings immediately
    window.global_settings = {
      ...window.global_settings,
      ...newSettings
    };
  }, [connected, context]);

  return {
    connected,
    settings,
    actionInfo: actionInfo || undefined,
    action: actionUUID,
    context: context,
    setSettings,
    sendToPlugin,
    sendToPluginGlobal,
    setGlobalSettings
  };
}
