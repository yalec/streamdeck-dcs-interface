/**
 * Comms Window - Migration propre depuis comms_window_functions.js
 * 
 * Cette version suit exactement la logique du code JavaScript original
 */

import { useState, useEffect } from "react";
import styles from "./CommsWindow.module.css";

// Types pour la communication avec window.opener
interface GlobalSettings {
  ip_address: string;
  listener_port: string;
  send_port: string;
  [key: string]: unknown;
}

interface OpenerWindow extends Window {
  global_settings: GlobalSettings;
  gotCallbackFromCommsWindow: (message: { event: string; payload?: unknown }) => void;
}

interface DcsGameState {
  [dcsId: string]: string | number;
}

// Étendre Window pour les callbacks
declare global {
  interface Window {
    gotDcsGameState?: (gameState: DcsGameState | null) => void;
  }
}

const CommsWindow: React.FC = () => {
  // États basés sur le DOM du HTML original
  const [ipAddress, setIpAddress] = useState("127.0.0.1");
  const [listenerPort, setListenerPort] = useState("1725");
  const [sendPort, setSendPort] = useState("26027");
  const [connectionSettingsVisible, setConnectionSettingsVisible] = useState(false);
  const [gameState, setGameState] = useState<DcsGameState | null>(null);
  const [noModuleDetected, setNoModuleDetected] = useState(false);

  /**
   * Équivalent de sendmessage() du code original
   * Envoie un message au Property Inspector via window.opener
   */
  const sendMessage = (event: string, payload?: unknown) => {
    if (!window.opener) {
      console.error("window.opener not available");
      return;
    }

    const opener = window.opener as OpenerWindow;
    if (!opener.gotCallbackFromCommsWindow) {
      console.error("gotCallbackFromCommsWindow not available on opener");
      return;
    }

    const msg: { event: string; payload?: unknown } = { event };
    if (payload !== undefined) {
      msg.payload = payload;
    }
    opener.gotCallbackFromCommsWindow(msg);
  };

  /**
   * Équivalent de callbackUpdateConnectionSettings() du code original
   */
  const updateConnectionSettings = () => {
    if (!window.opener) return;

    const opener = window.opener as OpenerWindow;
    opener.global_settings.ip_address = ipAddress;
    opener.global_settings.listener_port = listenerPort;
    opener.global_settings.send_port = sendPort;

    sendMessage("updateGlobalSettings", opener.global_settings);
  };

  /**
   * Équivalent de restoreGlobalSettings() du code original
   */
  const restoreGlobalSettings = (settings: GlobalSettings) => {
    setIpAddress(settings.ip_address || "127.0.0.1");
    setListenerPort(settings.listener_port || "1725");
    setSendPort(settings.send_port || "26027");
    // Fields and button remain hidden until we've received settings from PI
    // to avoid showing the wrong information.
    setConnectionSettingsVisible(true);
  };

  /**
   * Équivalent de callbackRefreshDcsGameState() du code original
   */
  const refreshDcsGameState = () => {
    sendMessage("refreshDcsState");
  };

  /**
   * Équivalent de gotDcsGameState() du code original
   * Populates rows of table with the DCS ID and values from received DCS game state.
   */
  const handleGameStateUpdate = (current_game_state: DcsGameState | null) => {
    if (current_game_state == null) {
      setNoModuleDetected(true);
      setGameState(null);
    } else {
      setNoModuleDetected(false);
      setGameState(current_game_state);
    }
  };

  /**
   * Équivalent de loaded() du code original - appelé au chargement de la fenêtre
   */
  useEffect(() => {
    if (window.opener) {
      const opener = window.opener as OpenerWindow;
      if (opener.global_settings) {
        restoreGlobalSettings(opener.global_settings);
      }
    }

    // Expose gotDcsGameState globally for Property Inspector to call
    window.gotDcsGameState = handleGameStateUpdate;

    return () => {
      delete window.gotDcsGameState;
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Connection Settings Section */}
      {connectionSettingsVisible && (
        <div id="connection_settings_div">
          <div className={styles.heading}>DCS Export Connection Global Settings</div>
          <div className={styles.wrap}>
            <p>
              The IP Address and Ports for communication with the DCS Export script can be set here
              for all Streamdeck buttons
            </p>
          </div>

          <div className={styles.wrap} style={{ maxWidth: "250px" }}>
            <div className={styles.item}>
              <div className={styles.itemLabel}>IP Address</div>
              <input
                className={styles.itemValue}
                id="ip_address"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="Default: 127.0.0.1"
                pattern="\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
              />
            </div>

            <div className={styles.item}>
              <div className={styles.itemLabel}>Listener Port</div>
              <input
                id="listener_port"
                className={styles.itemValue}
                type="text"
                value={listenerPort}
                onChange={(e) => setListenerPort(e.target.value)}
                placeholder="Default: 1725"
              />
            </div>

            <div className={styles.item}>
              <div className={styles.itemLabel}>Send Port</div>
              <input
                id="send_port"
                className={styles.itemValue}
                type="text"
                value={sendPort}
                onChange={(e) => setSendPort(e.target.value)}
                placeholder="Default: 26027"
              />
            </div>

            <button
              id="update_connection_settings_button"
              type="button"
              onClick={updateConnectionSettings}
            >
              Update Connection Settings
            </button>
          </div>
        </div>
      )}

      {/* Debug - Print Current DCS Game Values Section */}
      <div className={styles.heading}>Debug - Print Current DCS Game Values</div>
      <div className={styles.wrap}>
        <button id="refresh_dcs_state" type="button" onClick={refreshDcsGameState}>
          Refresh
        </button>

        <div className={styles.item} id="game_state_table">
          <table className={styles.table} style={{ width: "70%" }}>
            <thead>
              <tr>
                <td>
                  <b>DCS ID</b>
                </td>
                <td>
                  <b>Last Received Value</b>
                </td>
              </tr>
            </thead>
            <tbody>
              {gameState &&
                Object.entries(gameState).map(([dcsId, value]) => (
                  <tr key={dcsId}>
                    <td>{dcsId}</td>
                    <td>{value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Module Detected Text */}
      {noModuleDetected && (
        <div id="no_module_detected_text" className={styles.wrap}>
          <p>DCS module not detected.</p>
          <p>
            Check that DCS mission is running, there is a .lua script for the module within
            "DCS-ExportScript\ExportsModules\", and the port settings above match those in
            "DCS-ExportScript\Config.lua"
          </p>
        </div>
      )}
    </div>
  );
};

export default CommsWindow;
