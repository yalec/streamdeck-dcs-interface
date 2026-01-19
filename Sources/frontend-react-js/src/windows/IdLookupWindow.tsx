/**
 * ID Lookup Window - Migration propre depuis id_lookup_window_functions.js
 * 
 * Cette version suit exactement la logique du code JavaScript original
 * sans ajouter de complexité inutile.
 */

import { useState, useEffect } from "react";
import styles from "./IdLookupWindow.module.css";

// Types pour la communication avec window.opener
interface GlobalSettings {
  dcs_install_path: string;
  dcs_savedgames_path?: string;
  last_selected_module?: string;
  last_search_query?: string;
  [key: string]: unknown;
}

interface OpenerWindow extends Window {
  global_settings: GlobalSettings;
  gotCallbackFromIdLookupWindow: (message: { event: string; payload?: unknown }) => void;
}

export interface ClickableDataRow {
  device: string;
  device_id: string;
  button_id: string;
  element: string;
  type: string;
  dcs_id: string;
  click_value: string;
  limit_min: string;
  limit_max: string;
  description: string;
}

// Étendre Window pour les callbacks
declare global {
  interface Window {
    gotInstalledModules?: (modulesList: string[]) => void;
    gotClickabledata?: (data: string[]) => void;
  }
}

const IdLookupWindow: React.FC = () => {
  // États basés sur le DOM du HTML original
  const [dcsInstallPath, setDcsInstallPath] = useState("C:\\Program Files\\Eagle Dynamics\\DCS World");
  const [dcsSavedGamesPath, setDcsSavedGamesPath] = useState("%USERPROFILE%\\Saved Games\\DCS");
  const [modules, setModules] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [clickableData, setClickableData] = useState<ClickableDataRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<ClickableDataRow | null>(null);

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
    if (!opener.gotCallbackFromIdLookupWindow) {
      console.error("gotCallbackFromIdLookupWindow not available on opener");
      return;
    }

    const msg: { event: string; payload?: unknown } = { event };
    if (payload !== undefined) {
      msg.payload = payload;
    }
    opener.gotCallbackFromIdLookupWindow(msg);
  };

  /**
   * Équivalent de UpdateGlobalSettings() du code original
   */
  const updateGlobalSettings = () => {
    if (!window.opener) return;

    const opener = window.opener as OpenerWindow;
    opener.global_settings.dcs_install_path = dcsInstallPath;
    opener.global_settings.dcs_savedgames_path = dcsSavedGamesPath;
    if (selectedModule) {
      opener.global_settings.last_selected_module = selectedModule;
    }
    opener.global_settings.last_search_query = searchQuery;

    sendMessage("UpdateGlobalSettings", opener.global_settings);
  };

  /**
   * Équivalent de RequestInstalledModules() du code original
   */
  const requestInstalledModules = () => {
    sendMessage("RequestInstalledModules", {
      dcs_install_path: dcsInstallPath,
      dcs_savedgames_path: dcsSavedGamesPath,
    });
    updateGlobalSettings();
  };

  /**
   * Équivalent de callbackRequestIdLookup() du code original
   */
  const requestIdLookup = (clearSearch = false, moduleOverride?: string) => {
    setClickableData([]);
    setSelectedRow(null);
    
    if (clearSearch) {
      setSearchQuery("");
      if (window.opener) {
        const opener = window.opener as OpenerWindow;
        opener.global_settings.last_search_query = "";
      }
    }

    const moduleToUse = moduleOverride || selectedModule;
    if (moduleToUse) {
      const payload = {
        dcs_install_path: dcsInstallPath,
        dcs_savedgames_path: dcsSavedGamesPath,
        module: moduleToUse,
      };
      sendMessage("RequestIdLookup", payload);
    }

    updateGlobalSettings();
  };

  /**
   * Équivalent de modifyInstalledModulesList() du code original
   */
  const modifyModulesList = (modulesList: string[]): string[] => {
    const modified = [...modulesList];
    
    for (let i = 0; i < modified.length; i++) {
      if (modified[i] === "L-39C") {
        modified.push("L-39ZA");
      }
      if (modified[i] === "C-101") {
        modified[i] = "C-101CC";
        modified.push("C-101EB");
      }
    }
    
    modified.sort();
    return modified;
  };

  /**
   * Filtre les données clickable selon la recherche
   */
  const filteredClickableData = clickableData.filter((row) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      row.device.toLowerCase().includes(query) ||
      row.element.toLowerCase().includes(query) ||
      row.dcs_id.toLowerCase().includes(query) ||
      row.description.toLowerCase().includes(query)
    );
  });

  /**
   * Gestionnaire de sélection de ligne
   */
  const handleRowClick = (row: ClickableDataRow) => {
    setSelectedRow(row);
  };

  /**
   * Import DCS Command (équivalent de callbackImportDcsCommand() du code original)
   */
  const importDcsCommand = (switchDirection = "") => {
    if (!selectedRow) {
      alert("Please select a row first");
      return;
    }

    const payload = {
      device_id: selectedRow.device_id,
      button_id: selectedRow.button_id,
      dcs_id: selectedRow.dcs_id,
      click_value: selectedRow.click_value,
      limit_min: selectedRow.limit_min,
      limit_max: selectedRow.limit_max,
      switch_direction: switchDirection,
    };

    sendMessage("ImportDcsCommand", payload);
    updateGlobalSettings();
    window.close();
  };

  /**
   * Import Image State Change (équivalent de callbackImportImageChange() du code original)
   */
  const importImageChange = () => {
    if (!selectedRow) {
      alert("Please select a row first");
      return;
    }

    const payload = {
      dcs_id: selectedRow.dcs_id,
    };

    sendMessage("ImportImageChange", payload);
    updateGlobalSettings();
    window.close();
  };

  /**
   * Import Title Text (équivalent de callbackImportTextChange() du code original)
   */
  const importTextChange = () => {
    if (!selectedRow) {
      alert("Please select a row first");
      return;
    }

    const payload = {
      dcs_id: selectedRow.dcs_id,
    };

    sendMessage("ImportTextChange", payload);
    updateGlobalSettings();
    window.close();
  };

  /**
   * Import Switch First to Second (équivalent de callbackImportSwitchFirstToSecond() du code original)
   */
  const importSwitchFirstToSecond = () => {
    importDcsCommand("1st_to_2nd");
    importImageChange();
  };

  /**
   * Import Switch Second to First (équivalent de callbackImportSwitchSecondToFirst() du code original)
   */
  const importSwitchSecondToFirst = () => {
    importDcsCommand("2nd_to_1st");
    importImageChange();
  };

  /**
   * Équivalent de restoreGlobalSettings() + loaded() du code original
   * Appelé au montage du composant
   */
  useEffect(() => {
    if (!window.opener) {
      console.error("ERROR: window.opener not available");
      alert("ERROR: This window must be opened from the Property Inspector.");
      return;
    }

    const opener = window.opener as OpenerWindow;
    if (!opener.global_settings) {
      console.error("ERROR: global_settings not available on opener");
      alert("ERROR: Global settings not initialized.");
      return;
    }

    // Restaurer les settings (équivalent de restoreGlobalSettings)
    const installPath = opener.global_settings.dcs_install_path || "C:\\Program Files\\Eagle Dynamics\\DCS World";
    const savedGamesPath = opener.global_settings.dcs_savedgames_path || "%USERPROFILE%\\Saved Games\\DCS";
    
    setDcsInstallPath(installPath);
    setDcsSavedGamesPath(savedGamesPath);
    setSelectedModule(opener.global_settings.last_selected_module || "");
    setSearchQuery(opener.global_settings.last_search_query || "");

    // Exposer gotInstalledModules pour que le Property Inspector puisse l'appeler
    window.gotInstalledModules = (modulesList: string[]) => {
      const modified = modifyModulesList(modulesList);
      setModules(modified);

      // Select the last selected module and search last query for convenience
      // Suit exactement le pattern de gotInstalledModules() du code original
      const lastModule = opener.global_settings.last_selected_module || "";
      const lastQuery = opener.global_settings.last_search_query || "";
      
      if (lastModule) {
        setSelectedModule(lastModule);
      }
      setSearchQuery(lastQuery);
      
      // Trigger requestIdLookup automatically if we had a last module
      // clear_search=false to keep the search query
      // Use captured paths from closure to avoid React state timing issues
      if (lastModule && modified.includes(lastModule)) {
        const payload = {
          dcs_install_path: installPath,
          dcs_savedgames_path: savedGamesPath,
          module: lastModule,
        };
        sendMessage("RequestIdLookup", payload);
      }
    };

    // Exposer gotClickabledata pour que le Property Inspector puisse l'appeler
    window.gotClickabledata = (data: string[]) => {
      // Parser les données (format CSV)
      const parsed = data.map((element: string) => {
        const parts = element.split(',');
        const deviceStr = parts[0] || "";
        const deviceId = deviceStr.includes('(') && deviceStr.includes(')')
          ? deviceStr.split('(').pop()?.split(')')[0] || ""
          : "";

        return {
          device: deviceStr,
          device_id: deviceId,
          button_id: parts[1] || "",
          element: parts[2] || "",
          type: parts[3] || "",
          dcs_id: parts[4] || "",
          click_value: parts[5] || "",
          limit_min: parts[6] || "",
          limit_max: parts[7] || "",
          description: parts[8] || "",
        };
      });

      setClickableData(parsed);
    };

    // Demander les modules au démarrage si les chemins sont déjà configurés
    // (équivalent de RequestInstalledModules() dans loaded() du code original)
    // Le code original appelle toujours RequestInstalledModules(), même avec des paths par défaut
    sendMessage("RequestInstalledModules", {
      dcs_install_path: installPath,
      dcs_savedgames_path: savedGamesPath,
    });

    // Cleanup
    return () => {
      delete window.gotInstalledModules;
      delete window.gotClickabledata;
    };
    // sendMessage is stable
    // eslint-disable-next-line
  }, []);

  // Rendering du composant
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>ID Lookup</h2>
      </div>

      <div className={styles.controls}>
        <div className={styles.pathSection}>
          <label htmlFor="dcsInstallPath">DCS Install Path:</label>
          <input
            id="dcsInstallPath"
            type="text"
            value={dcsInstallPath}
            onChange={(e) => setDcsInstallPath(e.target.value)}
            className={styles.pathInput}
            placeholder="Default: C:\Program Files\Eagle Dynamics\DCS World"
          />
        </div>

        <div className={styles.pathSection}>
          <label htmlFor="dcsSavedGamesPath">DCS Saved Games Path:</label>
          <input
            id="dcsSavedGamesPath"
            type="text"
            value={dcsSavedGamesPath}
            onChange={(e) => setDcsSavedGamesPath(e.target.value)}
            className={styles.pathInput}
            placeholder="Example: %USERPROFILE%\Saved Games\DCS.openbeta (for community mods)"
          />
          <button onClick={requestInstalledModules} className={styles.updateButton}>
            Update
          </button>
        </div>

        <div className={styles.moduleSection}>
          <label htmlFor="moduleSelect">Module:</label>
          <select
            id="moduleSelect"
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              // Auto-request when module changes
              if (e.target.value) {
                setTimeout(() => requestIdLookup(true), 50);
              }
            }}
            className={styles.moduleSelect}
          >
            <option value="">-- Select Module --</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchSection}>
          <label htmlFor="searchQuery">Search:</label>
          <input
            id="searchQuery"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateGlobalSettings();
            }}
            className={styles.searchInput}
            placeholder="Filter by device, element, ID, or description..."
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.clickableTable}>
          <thead>
            <tr>
              <th>Device (ID)</th>
              <th>Button ID</th>
              <th>Element</th>
              <th>Type</th>
              <th>DCS ID</th>
              <th>Click Value</th>
              <th>Limit Min</th>
              <th>Limit Max</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredClickableData.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.noData}>
                  {selectedModule
                    ? searchQuery
                      ? "No results matching your search"
                      : "Loading clickable data..."
                    : "Select a module to view clickable data"}
                </td>
              </tr>
            ) : (
              filteredClickableData.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => handleRowClick(row)}
                  className={selectedRow === row ? styles.selected : ""}
                >
                  <td>{row.device}</td>
                  <td>{row.button_id}</td>
                  <td>{row.element}</td>
                  <td>{row.type}</td>
                  <td>{row.dcs_id}</td>
                  <td>{row.click_value}</td>
                  <td>{row.limit_min}</td>
                  <td>{row.limit_max}</td>
                  <td>{row.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <div className={styles.importSection}>
          <h3>Import Selection to:</h3>
          <div className={styles.importButtons}>
            <button onClick={importSwitchFirstToSecond} className={styles.importButton}>
              Switch 1st→2nd State
            </button>
            <button onClick={importSwitchSecondToFirst} className={styles.importButton}>
              Switch 2nd→1st State
            </button>
          </div>
          <h3>Or Individually to:</h3>
          <div className={styles.importButtons}>
            <button onClick={() => importDcsCommand()} className={styles.importButton}>
              DCS Command
            </button>
            <button onClick={importImageChange} className={styles.importButton}>
              Image State Change
            </button>
            <button onClick={importTextChange} className={styles.importButton}>
              Title Text Change
            </button>
          </div>
          <p className={styles.note}>
            Note: Import sets ID values, but you should still check and set the DCS command values manually after importing
          </p>
        </div>
      )}

      {clickableData.length > 0 && (
        <div className={styles.typeHintsSection}>
          <h3>Type Descriptions:</h3>
          <p>
            <strong>BTN:</strong> Button - recommend using button with press/release set to the limit max/min<br />
            <strong>TUMB:</strong> Rotary/Switch - use increment to advance within range, or switch to select two values<br />
            <strong>LEV:</strong> Axis - use increment to advance within range, increment value can be adjusted for sensitivity. 
            Some LEV items will need to use the momentary button with the "Send on Release" disabled.
          </p>
        </div>
      )}
    </div>
  );
};

export default IdLookupWindow;
