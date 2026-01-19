import { useState, useEffect } from "react";
import { usePropertyInspector } from "../hooks/usePropertyInspector";
import {
  ButtonSettings,
  ButtonActionType,
  getButtonActionType,
} from "../types/ButtonPropertyInspectorTypes";
import { ExternalWindowCallback, GlobalSettings } from "../types/StreamDeckTypes";
import styles from "./CommonPropertyInspector.module.css";

const ButtonPropertyInspector: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { settings, setSettings, actionInfo, sendToPlugin, sendToPluginGlobal, setGlobalSettings, connected, action: _action, context: _context } = usePropertyInspector<ButtonSettings>();
  const [buttonType, setButtonType] = useState<ButtonActionType>("momentary");

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

  // Detect button type from action UUID
  useEffect(() => {
    if (actionInfo?.action) {
      const detectedType = getButtonActionType(actionInfo.action);
      setButtonType(detectedType);
    }
  }, [actionInfo]);

  // Set default settings based on button type
  useEffect(() => {
    if (!settings) return;

    const defaults: Partial<ButtonSettings> = {};

    switch (buttonType) {
      case "switch":
        if (!settings.send_when_first_state_value) defaults.send_when_first_state_value = "1";
        if (!settings.send_when_second_state_value) defaults.send_when_second_state_value = "-1";
        break;
      case "increment":
        if (!settings.increment_value) defaults.increment_value = "0.1";
        if (!settings.increment_min) defaults.increment_min = "0";
        if (!settings.increment_max) defaults.increment_max = "1";
        if (settings.increment_cycle_allowed_check === undefined) defaults.increment_cycle_allowed_check = false;
        break;
      case "momentary":
        if (!settings.press_value) defaults.press_value = "1";
        if (!settings.release_value) defaults.release_value = "0";
        if (settings.disable_release_check === undefined) defaults.disable_release_check = false;
        break;
    }

    // Common defaults
    if (!settings.dcs_id_comparison_value) defaults.dcs_id_comparison_value = "0";
    if (!settings.string_monitor_vertical_spacing) defaults.string_monitor_vertical_spacing = "0";
    if (settings.string_monitor_passthrough_check === undefined) defaults.string_monitor_passthrough_check = true;

    if (Object.keys(defaults).length > 0) {
      setSettings({ ...settings, ...defaults });
    }
  }, [buttonType, settings, setSettings]);

  const handleInputChange = (field: keyof ButtonSettings, value: string | boolean) => {
    const updated = { ...settings, [field]: value };

    // Auto-compute send_address when button_id or device_id changes
    if ((field === "button_id" || field === "device_id") && updated.button_id && updated.device_id) {
      updated.send_address = `${updated.device_id},${updated.button_id}`;
    }

    setSettings(updated);
  };

  const handleClearDcsCommand = () => {
    setSettings({
      ...settings,
      button_id: "",
      device_id: "",
      send_address: "",
    });
  };

  const handleClearCompareMonitor = () => {
    setSettings({
      ...settings,
      dcs_id_compare_monitor: "",
      dcs_id_comparison_value: "0",
    });
  };

  const handleClearStringMonitor = () => {
    setSettings({
      ...settings,
      dcs_id_string_monitor: "",
      string_monitor_mapping: "",
    });
  };

  const openExternalWindow = (windowName: "idLookup" | "help" | "comms") => {
    const urls = {
      idLookup: "../../propertyinspector/idlookup-react/index.html",
      help: "../../helpDocs/helpWindow.html",
      comms: "../../propertyinspector/comms-react/index.html",
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
    // Listen for messages from external windows
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
        const updated: Partial<ButtonSettings> = {
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
      if (parameter.event === "ImportImageChange" && parameter.payload) {
        handleInputChange("dcs_id_compare_monitor", parameter.payload.dcs_id as string);
      }

      // Import String Monitor (Title Text Change)
      if (parameter.event === "ImportTextChange" && parameter.payload) {
        handleInputChange("dcs_id_string_monitor", parameter.payload.dcs_id as string);
      }

      // Import Switch First to Second
      if (parameter.event === "ImportSwitchFirstToSecond" && parameter.payload) {
        handleInputChange("button_id", parameter.payload.button_id as string);
        handleInputChange("device_id", parameter.payload.device_id as string);
        handleInputChange("send_when_first_state_value", parameter.payload.value as string);
      }

      // Import Switch Second to First
      if (parameter.event === "ImportSwitchSecondToFirst" && parameter.payload) {
        handleInputChange("button_id", parameter.payload.button_id as string);
        handleInputChange("device_id", parameter.payload.device_id as string);
        handleInputChange("send_when_second_state_value", parameter.payload.value as string);
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

      {/* DCS Command Settings */}
      <details open>
        <summary>DCS Command (on Button Press) Settings</summary>

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

        {/* Momentary Button Settings */}
        {buttonType === "momentary" && (
          <>
            <div className={styles.field}>
              <label>Send Value while Pressed</label>
              <input
                type="text"
                value={settings?.press_value || ""}
                onChange={(e) => handleInputChange("press_value", e.target.value)}
                placeholder="Example: 1"
              />
            </div>

            <div className={styles.field}>
              <label>Send Value while Released</label>
              <input
                type="text"
                value={settings?.release_value || ""}
                onChange={(e) => handleInputChange("release_value", e.target.value)}
                placeholder="Example: 0"
                disabled={settings?.disable_release_check}
                style={{
                  backgroundColor: settings?.disable_release_check ? "#222222" : "",
                  color: settings?.disable_release_check ? "#333333" : "",
                }}
              />
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings?.disable_release_check || false}
                  onChange={(e) => handleInputChange("disable_release_check", e.target.checked)}
                  id="disable_release_check"
                />
                <label htmlFor="disable_release_check">Disable</label>
              </div>
            </div>
          </>
        )}

        {/* Switch Button Settings */}
        {buttonType === "switch" && (
          <>
            <div className={styles.field}>
              <label>Send Value for 1st→2nd State</label>
              <input
                type="text"
                value={settings?.send_when_first_state_value || ""}
                onChange={(e) => handleInputChange("send_when_first_state_value", e.target.value)}
                placeholder="Example: 1"
              />
            </div>

            <div className={styles.field}>
              <label>Send Value for 2nd→1st State</label>
              <input
                type="text"
                value={settings?.send_when_second_state_value || ""}
                onChange={(e) => handleInputChange("send_when_second_state_value", e.target.value)}
                placeholder="Example: -1"
              />
            </div>
          </>
        )}

        {/* Increment Button Settings */}
        {buttonType === "increment" && (
          <>
            <div className={styles.field}>
              <label>DCS ID</label>
              <input
                type="text"
                value={settings?.dcs_id_increment_monitor || ""}
                onChange={(e) => handleInputChange("dcs_id_increment_monitor", e.target.value)}
                placeholder="Enter number"
              />
            </div>

            <div className={styles.field}>
              <label>Increment by Value</label>
              <input
                type="text"
                value={settings?.increment_value || ""}
                onChange={(e) => handleInputChange("increment_value", e.target.value)}
                placeholder="Example: 0.1"
              />
            </div>

            <div className={styles.field}>
              <label>Increment range min/max</label>
              <input
                type="text"
                value={settings?.increment_min || ""}
                onChange={(e) => handleInputChange("increment_min", e.target.value)}
                placeholder="Example: 0"
              />
              <input
                type="text"
                value={settings?.increment_max || ""}
                onChange={(e) => handleInputChange("increment_max", e.target.value)}
                placeholder="Example: 1"
              />
            </div>

            <div className={styles.field}>
              <label>Cycle Settings</label>
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings?.increment_cycle_allowed_check || false}
                  onChange={(e) => handleInputChange("increment_cycle_allowed_check", e.target.checked)}
                  id="increment_cycle_check"
                />
                <label htmlFor="increment_cycle_check">Allow cycling to beginning</label>
              </div>
            </div>
          </>
        )}
      </details>

      {/* Image State Change Monitor */}
      <details>
        <summary>Image State Change on DCS Update Settings</summary>

        <div className={styles.field}>
          <label>DCS ID</label>
          <input
            type="text"
            value={settings?.dcs_id_compare_monitor || ""}
            onChange={(e) => handleInputChange("dcs_id_compare_monitor", e.target.value)}
            placeholder="Enter number"
          />
          <button onClick={handleClearCompareMonitor}>Clear</button>
        </div>

        <div className={styles.field}>
          <label>Show 2nd State Image When</label>
          <select
            value={settings?.dcs_id_compare_condition || "GREATER_THAN"}
            onChange={(e) => handleInputChange("dcs_id_compare_condition", e.target.value)}
          >
            <option value="GREATER_THAN">is greater than (&gt;) below value</option>
            <option value="EQUAL_TO">is equal to (==) below value</option>
            <option value="LESS_THAN">is less than (&lt;) below value</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Value</label>
          <input
            type="text"
            value={settings?.dcs_id_comparison_value || ""}
            onChange={(e) => handleInputChange("dcs_id_comparison_value", e.target.value)}
            placeholder="Specify condition value"
          />
        </div>
      </details>

      {/* Title Text Change Monitor */}
      <details>
        <summary>Title Text Change on DCS Update Settings</summary>

        <div className={styles.field}>
          <label>DCS ID</label>
          <input
            type="text"
            value={settings?.dcs_id_string_monitor || ""}
            onChange={(e) => handleInputChange("dcs_id_string_monitor", e.target.value)}
            placeholder="Enter number"
          />
          <button onClick={handleClearStringMonitor}>Clear</button>
        </div>

        <div className={styles.field}>
          <label>Vertical Spacing</label>
          <input
            type="text"
            value={settings?.string_monitor_vertical_spacing || ""}
            onChange={(e) => handleInputChange("string_monitor_vertical_spacing", e.target.value)}
            placeholder="Positive moves text up, negative moves text down"
          />
        </div>

        <div className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings?.string_monitor_passthrough_check ?? true}
            onChange={(e) => handleInputChange("string_monitor_passthrough_check", e.target.checked)}
            id="string_passthrough_check"
          />
          <label htmlFor="string_passthrough_check">Display string unaltered</label>
        </div>

        {!settings?.string_monitor_passthrough_check && (
          <div className={styles.field}>
            <label>Map Value to Display Text</label>
            <textarea
              value={settings?.string_monitor_mapping || ""}
              onChange={(e) => handleInputChange("string_monitor_mapping", e.target.value)}
              placeholder="Enter as 'key=text,key=text' Example: 0.1=ValA,0.2=ValB,0.3=ValC"
              rows={3}
            />
          </div>
        )}
      </details>

      {/* External Windows */}
      <div className={styles.buttonGroup}>
        <button onClick={() => openExternalWindow("idLookup")}>ID Lookup</button>
        <button onClick={() => openExternalWindow("help")}>Help</button>
        <button onClick={() => openExternalWindow("comms")}>DCS Comms</button>
      </div>
    </div>
  );
};

export default ButtonPropertyInspector;
