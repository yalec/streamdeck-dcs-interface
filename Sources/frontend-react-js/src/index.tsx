import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

// Property Inspectors
import EncoderPropertyInspector from "./propertyinspectors/EncoderPropertyInspector";
import ButtonPropertyInspector from "./propertyinspectors/ButtonPropertyInspector";
import DcsBiosPropertyInspector from "./propertyinspectors/DcsBiosPropertyInspector";

// External Windows
import IdLookupWindow from "./windows/IdLookupWindow";
import CommsWindow from "./windows/CommsWindow";
import DCBiosWindow from "./windows/DCBiosWindow";

// Detect context based on URL parameters or window properties
const urlParams = new URLSearchParams(window.location.search);
const windowType = urlParams.get("window");
const isConfigWindow = window.opener && window.opener.socketSettings;
const piType = process.env.REACT_APP_PI_TYPE;
const windowBuildType = process.env.REACT_APP_WINDOW_TYPE; // For standalone window builds

let Component: React.ComponentType;

// Check if this is a standalone window build first
if (windowBuildType === "idlookup" || windowType === "idlookup") {
  // ID Lookup external window
  Component = IdLookupWindow;
} else if (windowBuildType === "comms" || windowType === "comms") {
  // Comms external window
  Component = CommsWindow;
} else if (windowBuildType === "dcsbios" || windowType === "dcsbios") {
  // DCS BIOS configuration window
  Component = DCBiosWindow;
} else if (isConfigWindow) {
  // Legacy compatibility: DCS-BIOS configuration popup window opened from old dcs_bios_prop_inspector.html
  Component = DCBiosWindow;
} else {
  // This is a Property Inspector embedded in Stream Deck
  switch (piType) {
    case "encoder":
      Component = EncoderPropertyInspector;
      break;
    case "button":
      Component = ButtonPropertyInspector;
      break;
    case "dcsbios":
      Component = DcsBiosPropertyInspector;
      break;
    default:
      // No PI_TYPE and not a config window - this should not happen in production
      console.error("No REACT_APP_PI_TYPE specified for Property Inspector build");
      Component = DCBiosWindow; // Fallback to DCBios window
  }
}

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById("root")
);
