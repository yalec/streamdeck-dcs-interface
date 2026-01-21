import { useState } from "react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { StreamdeckSocketSettings, defaultStreamdeckSocketSettings, useStreamdeckWebsocket } from "../api/Streamdeck/StreamdeckWebsocket";
import ButtonConfiguration from "../areas/ButtonConfiguration";
import IdLookup from "../areas/IdLookup";
import RightSidebar from "../areas/RightSidebar";
import PluginSetup from "../modals/PluginSetup";

import styles from "./DCBiosWindow.module.css"

// Augment the Window type for known variable in opening window.
interface Window { socketSettings: StreamdeckSocketSettings }

/**
 * DCBiosWindow - Fenêtre de configuration DCS BIOS
 * 
 * Cette fenêtre est ouverte depuis le property inspector DCS BIOS
 * pour configurer les boutons et les commandes DCS-BIOS.
 */
function DCBiosWindow(): JSX.Element {
  console.log("=== DCBiosWindow Debug ===");
  console.log("window.opener exists:", !!window.opener);
  
  const propInspectorWindow = window.opener as Window;
  console.log("propInspectorWindow:", propInspectorWindow);
  console.log("propInspectorWindow.socketSettings:", propInspectorWindow?.socketSettings);
  
  const socketSettings = propInspectorWindow ? propInspectorWindow.socketSettings : defaultStreamdeckSocketSettings();
  console.log("Using socketSettings:", socketSettings);
  console.log("Port:", socketSettings.port);
  console.log("UUID:", socketSettings.propertyInspectorUUID);
  console.log("Action:", socketSettings.action);
  
  const sdApi = useStreamdeckWebsocket(socketSettings);

  const [pluginSetupVisible, setPluginSetupVisible] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.wrapper}>
        <div className={styles.buttonConfiguration}>
          <ButtonConfiguration sdApi={sdApi} />
        </div>
        <div className={styles.idLookup}>
          <IdLookup sdApi={sdApi} />
          {pluginSetupVisible && <PluginSetup sdApi={sdApi} hide={() => { setPluginSetupVisible(false) }} />}
        </div>
        <div className={styles.rightSidebar}>
          <RightSidebar showSetupModal={() => { setPluginSetupVisible(true) }} />
        </div>
      </div >
    </DndProvider>
  );
}

export default DCBiosWindow;
