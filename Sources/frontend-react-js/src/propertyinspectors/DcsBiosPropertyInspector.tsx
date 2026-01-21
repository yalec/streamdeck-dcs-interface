import { useState, useEffect } from "react";
import styles from "./DcsBiosPropertyInspector.module.css";

// Extend Window type to store config window reference and socket settings
declare global {
  interface Window {
    configWindow?: Window | null;
    socketSettings?: {
      port: string;
      propertyInspectorUUID: string;
      registerEvent: string;
      info: string;
      action: string;
    };
    settings?: Record<string, unknown>;
    connectElgatoStreamDeckSocket?: (
      inPort: string,
      inPropertyInspectorUUID: string,
      inRegisterEvent: string,
      inInfo: string,
      inActionInfo: string
    ) => void;
  }
}

const DcsBiosPropertyInspector: React.FC = () => {
  // Store socket settings WITHOUT creating a WebSocket connection
  // Only the popup window will create the WebSocket
  useEffect(() => {
    window.connectElgatoStreamDeckSocket = (
      inPort: string,
      inPropertyInspectorUUID: string,
      inRegisterEvent: string,
      inInfo: string,
      inActionInfo: string
    ) => {
      console.log("=== DcsBiosPropertyInspector: connectElgatoStreamDeckSocket called ===");
      
      // Parse action info
      const inAction = JSON.parse(inActionInfo);
      
      // Store settings to window object (for popup window to access)
      window.socketSettings = {
        port: inPort,
        propertyInspectorUUID: inPropertyInspectorUUID,
        registerEvent: inRegisterEvent,
        info: inInfo,
        action: inAction["action"],
      };
      window.settings = inAction["payload"]?.settings || inAction["settings"] || {};
      
      console.log("Stored socketSettings:", window.socketSettings);
      console.log("Stored settings:", window.settings);
      
      // DO NOT create WebSocket here - only the popup window should do that
    };
    
    console.log("DcsBiosPropertyInspector: connectElgatoStreamDeckSocket registered");
  }, []);
  
  const [configWindowOpen, setConfigWindowOpen] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  const handleConfigureClick = () => {
    // Only open if socketSettings are available and no window is already open
    if (window.socketSettings && (!window.configWindow || window.configWindow.closed)) {
      window.configWindow = window.open("../../windows/dcsbios/index.html", "Button Configuration");

      // Disable button to prevent multiple windows (matches original behavior)
      setConfigWindowOpen(true);
      setUserMessage("Beta limitation: Configure window can only be opened once. Re-select button to open again.");

      // Check if window closes
      const checkWindowClosed = setInterval(() => {
        if (window.configWindow?.closed) {
          setConfigWindowOpen(false);
          setUserMessage("");
          clearInterval(checkWindowClosed);
        }
      }, 500);
    } else if (!window.socketSettings) {
      setUserMessage("Error: Socket settings not initialized");
    } else {
      setUserMessage("Configuration window is already open");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonWrapper}>
        <button
          className={styles.configureButton}
          onClick={handleConfigureClick}
          disabled={configWindowOpen}
        >
          Configure
        </button>
      </div>
      {userMessage && <p className={styles.message}>{userMessage}</p>}
    </div>
  );
};

export default DcsBiosPropertyInspector;
