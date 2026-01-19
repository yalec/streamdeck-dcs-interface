import { useState } from "react";
import { usePropertyInspector } from "../hooks/usePropertyInspector";
import styles from "./DcsBiosPropertyInspector.module.css";

// Extend Window type to store config window reference
declare global {
  interface Window {
    configWindow?: Window | null;
  }
}

const DcsBiosPropertyInspector: React.FC = () => {
  // usePropertyInspector automatically stores window.socketSettings and window.settings
  usePropertyInspector();
  
  const [configWindowOpen, setConfigWindowOpen] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  const handleConfigureClick = () => {
    // Only open if socketSettings are available and no window is already open
    if (window.socketSettings && (!window.configWindow || window.configWindow.closed)) {
      window.configWindow = window.open("../settingsUI/index.html", "Button Configuration");

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
