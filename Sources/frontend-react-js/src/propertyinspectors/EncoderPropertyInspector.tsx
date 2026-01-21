import React, { useEffect, useState, useCallback } from "react";
import { usePropertyInspector } from "../hooks/usePropertyInspector";
import { EncoderSettings } from "../types/PropertyInspectorTypes";
import { ExternalWindowCallback, GlobalSettings } from "../types/StreamDeckTypes";
import { ValueMappingList } from "../components/ValueMappingList";
import { ValueMappingData } from "../components/ValueMappingRow";
import styles from "./CommonPropertyInspector.module.css";

const EncoderPropertyInspector: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { settings, setSettings, connected, sendToPlugin, sendToPluginGlobal, setGlobalSettings, action: _action, context: _context } = usePropertyInspector<EncoderSettings>();
  const [mappings, setMappings] = useState<ValueMappingData[]>([]);

  // Initialize global_settings IMMEDIATELY for external windows
  if (!window.global_settings) {
    window.global_settings = {
      ip_address: "127.0.0.1",
      listener_port: "1725",
      send_port: "26027",
      dcs_install_path: "C:\\Program Files\\Eagle Dynamics\\DCS World",
      dcs_savedgames_path: "%USERPROFILE%\\Saved Games\\DCS",
      last_selected_module: "",
      last_search_query: "",
    } as GlobalSettings;
  }

  // Deserialize mappings from settings
  useEffect(() => {
    if (settings.encoder_value_text_mapping) {
      setMappings(deserializeMappings(settings.encoder_value_text_mapping));
    }
  }, [settings.encoder_value_text_mapping]);

  // Serialize and save mappings
  const handleMappingsChange = useCallback((newMappings: ValueMappingData[]) => {
    setMappings(newMappings);
    setSettings({ encoder_value_text_mapping: serializeMappings(newMappings) });
  }, [setSettings]);

  const handleInputChange = (field: keyof EncoderSettings, value: string | boolean | number) => {
    setSettings({ [field]: value });
  };

  const handleClearDcsCommand = () => {
    setSettings({
      ...settings,
      button_id: "",
      device_id: "",
    });
  };

  const handleClearMonitor = () => {
    setSettings({
      ...settings,
      dcs_id_increment_monitor: "",
    });
  };

  const openExternalWindow = (windowName: "idLookup" | "help" | "comms") => {
    const urls = {
      idLookup: "../../windows/idlookup/index.html",
      help: "../../helpDocs/helpWindow.html",
      comms: "../../windows/comms/index.html",
    };

    const titles = {
      idLookup: "ID Lookup",
      help: "Help",
      comms: "Comms Settings",
    };

    const windowRefs: Record<string, Window | null | undefined> = {
      idLookup: window.idLookupWindow,
      help: window.helpWindow,
      comms: window.commsWindow,
    };

    // Only open if window doesn't exist or is closed
    const windowRef = windowRefs[windowName];
    if (!windowRef || windowRef.closed) {
      const newWindow = window.open(urls[windowName], titles[windowName]);
      
      // Store reference to window
      if (windowName === "idLookup") {
        window.idLookupWindow = newWindow;
      } else if (windowName === "help") {
        window.helpWindow = newWindow;
      } else if (windowName === "comms") {
        window.commsWindow = newWindow;
      }
    }
  };

  // Setup message listener for external windows communication
  useEffect(() => {
    // Listen for postMessage events (for Import operations)
    const handleMessage = (event: MessageEvent) => {
      const parameter = event.data as ExternalWindowCallback;
      if (!parameter || !parameter.event) return;

      // ID Lookup window messages
      // Handle UpdateGlobalSettings
      if (parameter.event === "UpdateGlobalSettings") {
        setGlobalSettings(parameter.payload as Record<string, unknown>);
      }

      // Handle RequestInstalledModules - forward to plugin
      if (parameter.event === "RequestInstalledModules" && parameter.payload) {
        if (!connected) {
          console.error("Cannot send RequestInstalledModules: not connected to Stream Deck");
          return;
        }
        const payload = typeof parameter.payload === "string" 
          ? { dcs_install_path: parameter.payload, dcs_savedgames_path: "" }
          : parameter.payload as { dcs_install_path: string; dcs_savedgames_path?: string };
        sendToPluginGlobal({
          event: "RequestInstalledModules",
          dcs_install_path: payload.dcs_install_path,
          dcs_savedgames_path: payload.dcs_savedgames_path || "",
        });
      }

      // Handle RequestIdLookup - forward to plugin
      if (parameter.event === "RequestIdLookup" && parameter.payload) {
        if (!connected) {
          console.error("Cannot send RequestIdLookup: not connected to Stream Deck");
          return;
        }
        const payload = parameter.payload as { dcs_install_path: string; dcs_savedgames_path?: string; module: string };
        sendToPluginGlobal({
          event: "RequestIdLookup",
          dcs_install_path: payload.dcs_install_path,
          dcs_savedgames_path: payload.dcs_savedgames_path || "",
          module: payload.module,
        });
      }

      // Import DCS Command
      if (parameter.event === "ImportDcsCommand" && parameter.payload) {
        const absClickValue = Math.abs(parseFloat(parameter.payload.click_value as string));
        const updated: Partial<EncoderSettings> = {
          button_id: parameter.payload.button_id as string,
          device_id: parameter.payload.device_id as string,
          send_address: `${parameter.payload.device_id},${parameter.payload.button_id}`,
          press_value: parameter.payload.click_value as string,
          release_value: "0",
          dcs_id_increment_monitor: parameter.payload.dcs_id as string,
          increment_value: parameter.payload.click_value as string,
          increment_min: parameter.payload.limit_min as string,
          increment_max: parameter.payload.limit_max as string,
          increment_cw: absClickValue.toString(),
          increment_ccw: (-absClickValue).toString(),
        };
        if (parameter.payload.switch_direction === "1st_to_2nd") {
          updated.send_when_first_state_value = parameter.payload.click_value as string;
        }
        if (parameter.payload.switch_direction === "2nd_to_1st") {
          updated.send_when_second_state_value = parameter.payload.click_value as string;
        }
        setSettings({ ...settings, ...updated });
      }

      // Import Comparison Monitor (Image State Change)
      if (parameter.event === "ImportComparisonMonitor" && parameter.payload) {
        handleInputChange("dcs_id_increment_monitor", parameter.payload.dcs_id as string);
      }

      // Import String Monitor (Title Text Change) - Encoders use text mapping instead
      if (parameter.event === "ImportStringMonitor" && parameter.payload) {
        handleInputChange("dcs_id_increment_monitor", parameter.payload.dcs_id as string);
      }

      // Import Switch First to Second
      if (parameter.event === "ImportSwitchFirstToSecond" && parameter.payload) {
        handleInputChange("button_id", parameter.payload.button_id as string);
        handleInputChange("device_id", parameter.payload.device_id as string);
        handleInputChange("increment_cw", parameter.payload.value as string);
      }

      // Import Switch Second to First
      if (parameter.event === "ImportSwitchSecondToFirst" && parameter.payload) {
        handleInputChange("button_id", parameter.payload.button_id as string);
        handleInputChange("device_id", parameter.payload.device_id as string);
        handleInputChange("increment_ccw", parameter.payload.value as string);
      }

      // Comms window messages
      if (parameter.event === "requestGlobalSettings") {
        // Request global settings - not needed as we already have them
      }

      if (parameter.event === "updateGlobalSettings" && parameter.payload) {
        setGlobalSettings(parameter.payload as Record<string, unknown>);
      }

      if (parameter.event === "refreshDcsState") {
        if (!connected) {
          console.error("Cannot send RequestDcsStateUpdate: not connected to Stream Deck");
          return;
        }
        sendToPluginGlobal({
          event: "RequestDcsStateUpdate",
        });
      }
    };

    // Listen for postMessage events (for Import operations)
    window.addEventListener("message", handleMessage);

    // Setup gotCallbackFromIdLookupWindow for IdLookupWindow to call
    window.gotCallbackFromIdLookupWindow = (callback: ExternalWindowCallback) => {
      handleMessage({ data: callback } as MessageEvent);
    };

    // Setup gotCallbackFromCommsWindow for CommsWindow to call
    window.gotCallbackFromCommsWindow = (callback: ExternalWindowCallback) => {
      handleMessage({ data: callback } as MessageEvent);
    };

    return () => {
      window.removeEventListener("message", handleMessage);
      delete window.gotCallbackFromIdLookupWindow;
      delete window.gotCallbackFromCommsWindow;
    };
  }, [settings, sendToPlugin, sendToPluginGlobal, handleInputChange, connected]);

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        {connected ? "✓ Connected" : "⚠ Disconnected"}
      </div>

      {/* Encoder Rotation Settings */}
      <section className={styles.section}>
        <h3>Encoder Rotation Settings</h3>

        <div className={styles.field}>
          <label>Button ID</label>
          <input
            type="text"
            value={settings?.button_id || ""}
            onChange={(e) => handleInputChange("button_id", e.target.value)}
            placeholder="Enter number"
          />
          <button onClick={handleClearDcsCommand}>Clear</button>
        </div>

        <div className={styles.field}>
          <label>Device ID</label>
          <input
            type="text"
            value={settings?.device_id || ""}
            onChange={(e) => handleInputChange("device_id", e.target.value)}
            placeholder="Enter number"
          />
        </div>

        <div className={styles.field}>
          <label>DCS ID (Monitor)</label>
          <input
            type="text"
            value={settings?.dcs_id_increment_monitor || ""}
            onChange={(e) => handleInputChange("dcs_id_increment_monitor", e.target.value)}
            placeholder="Enter DCS ID"
          />
          <button onClick={handleClearMonitor}>Clear</button>
        </div>

        <div className={styles.field}>
          <label>Increment CW</label>
          <input
            type="text"
            value={settings?.increment_cw || ""}
            onChange={(e) => handleInputChange("increment_cw", e.target.value)}
            placeholder="Example: 0.1"
          />
        </div>

        <div className={styles.field}>
          <label>Increment CCW</label>
          <input
            type="text"
            value={settings?.increment_ccw || ""}
            onChange={(e) => handleInputChange("increment_ccw", e.target.value)}
            placeholder="Example: -0.1"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label>Range min/max</label>
          <input
            type="text"
            value={settings?.increment_min || ""}
            onChange={(e) => handleInputChange("increment_min", e.target.value)}
            placeholder="Min"
          />
          <input
            type="text"
            value={settings?.increment_max || ""}
            onChange={(e) => handleInputChange("increment_max", e.target.value)}
            placeholder="Max"
          />
        </div>

        <div className={styles.checkbox}>
          <input
            type="checkbox"
            id="cycle"
            checked={settings?.increment_cycle_allowed_check || false}
            onChange={(e) => handleInputChange("increment_cycle_allowed_check", e.target.checked)}
          />
          <label htmlFor="cycle">Allow cycling</label>
        </div>
      </section>

      {/* Encoder Press Settings */}
      <section className={styles.section}>
        <h3>Encoder Press Settings</h3>

        <div className={styles.field}>
          <label>Value on Press</label>
          <input
            type="text"
            value={settings?.encoder_press_value || ""}
            onChange={(e) => handleInputChange("encoder_press_value", e.target.value)}
            placeholder="Leave empty for min value"
          />
        </div>
      </section>

      {/* Display Settings */}
      <section className={styles.section}>
        <h3>DCS Display Settings</h3>
        <ValueMappingList
          mappings={mappings}
          onChange={handleMappingsChange}
        />
      </section>

      {/* Help Buttons */}
      <div className={styles.buttonGroup}>
        <button onClick={() => openExternalWindow("idLookup")}>ID Lookup</button>
        <button onClick={() => openExternalWindow("help")}>Help</button>
        <button onClick={() => openExternalWindow("comms")}>DCS Comms</button>
      </div>
    </div>
  );
};

// Serialization helpers
function serializeMappings(mappings: ValueMappingData[]): string {
  return mappings
    .filter(m => m.dcsValue && (m.displayText || m.displayImage))
    .map(m => `${m.dcsValue}:${m.displayText || ""}:${m.displayImage || ""}:${m.textColor || ""}:${m.bgColor || ""}`)
    .join(";");
}

function deserializeMappings(str: string): ValueMappingData[] {
  if (!str) return [];
  
  return str.split(";")
    .filter(entry => entry.trim())
    .map((entry, idx) => {
      const parts = entry.split(":");
      return {
        id: `mapping_${idx}`,
        dcsValue: parts[0] || "",
        displayText: parts[1] || "",
        displayImage: parts[2] || "",
        textColor: parts[3] || "",
        bgColor: parts[4] || ""
      };
    });
}

export default EncoderPropertyInspector;
