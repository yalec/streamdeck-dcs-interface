/**
 * Common Stream Deck types used across the application
 */

import { ClickableDataRow } from '../windows/IdLookupWindow';

// Stream Deck WebSocket message types
export interface StreamDeckMessage {
  event: string;
  context?: string;
  action?: string;
  payload?: Record<string, unknown>;
  uuid?: string;
}

// Action info passed from Stream Deck
export interface ActionInfo {
  action: string;
  context: string;
  device: string;
  payload: {
    settings: Record<string, unknown>;
    coordinates?: {
      column: number;
      row: number;
    };
  };
}

// Socket settings stored in window
export interface SocketSettings {
  port: string;
  propertyInspectorUUID: string;
  registerEvent: string;
  info: string;
  action: string;
}

// Global settings shared across windows
export interface GlobalSettings {
  ip_address?: string;
  listener_port?: string;
  send_port?: string;
  dcs_install_path?: string;
  dcs_savedgames_path?: string;
  last_selected_module?: string;
  last_search_query?: string;
}

// External window callback parameter
export interface ExternalWindowCallback {
  event: string;
  payload?: Record<string, unknown>;
}

// Module info from DCS
export interface DcsModule {
  name: string;
  display_name?: string;
}

// Clickable data from DCS
export interface DcsClickableData {
  device_id: string;
  button_id: string;
  dcs_id: string;
  description?: string;
}

// DCS game state entry
export interface DcsGameStateEntry {
  dcs_id: string;
  value: string;
}

// Window references
export interface WindowRefs {
  idLookupWindow?: Window | null;
  helpWindow?: Window | null;
  commsWindow?: Window | null;
}

// Extended window interface for ID Lookup window with callbacks
export interface IdLookupWindowExt extends Window {
  gotInstalledModules?: (modulesList: string[]) => void;
  gotClickabledata?: (data: string[]) => void;  // C++ sends array of comma-separated strings
}

// Property Inspector window interface (for window.opener)
export interface PropertyInspectorWindow extends Window {
  global_settings: GlobalSettings;
}

// Extend Window interface
declare global {
  interface Window {
    connectElgatoStreamDeckSocket?: (
      inPort: string,
      inPropertyInspectorUUID: string,
      inRegisterEvent: string,
      inInfo: string,
      inActionInfo: string
    ) => void;
    socketSettings?: SocketSettings;
    settings?: Record<string, unknown>;
    global_settings?: GlobalSettings;
    settingsWindow?: Window | null;
    configWindow?: Window | null;
    idLookupWindow?: IdLookupWindowExt | null;
    helpWindow?: Window | null;
    commsWindow?: Window | null;
    gotCallbackFromIdLookupWindow?: (callback: ExternalWindowCallback) => void;
    gotCallbackFromCommsWindow?: (callback: ExternalWindowCallback) => void;
    // Note: Cannot override Window.opener type (WindowProxy | null) - use cast to PropertyInspectorWindow instead
  }
}
