import React, { useState } from "react";
import styles from "./ValueMappingRow.module.css";

export interface ValueMappingData {
  id: string;
  dcsValue: string;
  displayText: string;
  displayImage: string;
  textColor?: string;
  bgColor?: string;
}

interface ValueMappingRowProps {
  mapping: ValueMappingData;
  onChange: (id: string, mapping: ValueMappingData) => void;
  onDelete: (id: string) => void;
}

export const ValueMappingRow: React.FC<ValueMappingRowProps> = ({ mapping, onChange, onDelete }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof ValueMappingData, value: string) => {
    onChange(mapping.id, { ...mapping, [field]: value });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <div className={styles.field}>
          <label>Value:</label>
          <input
            type="text"
            placeholder="DCS Value"
            value={mapping.dcsValue}
            onChange={(e) => handleChange("dcsValue", e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnAdvanced}
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Advanced Settings"
          >
            ⚙
          </button>
          <button
            className={`${styles.btnSave} ${saved ? styles.saved : ""}`}
            onClick={handleSave}
            title="Save"
          >
            ✓
          </button>
          <button
            className={styles.btnDelete}
            onClick={() => onDelete(mapping.id)}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label>Text:</label>
        <input
          type="text"
          placeholder="Display Text"
          value={mapping.displayText}
          onChange={(e) => handleChange("displayText", e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>Image:</label>
        <input
          type="text"
          placeholder="Image Path (e.g., images/icon.png)"
          value={mapping.displayImage}
          onChange={(e) => handleChange("displayImage", e.target.value)}
        />
      </div>

      {showAdvanced && (
        <div className={styles.advanced}>
          <div className={styles.field}>
            <label>Text Color:</label>
            <input
              type="color"
              value={mapping.textColor || "#FFFFFF"}
              onChange={(e) => handleChange("textColor", e.target.value)}
            />
            <span className={styles.hint}>(Override global)</span>
          </div>

          <div className={styles.field}>
            <label>BG Color:</label>
            <input
              type="color"
              value={mapping.bgColor || "#000000"}
              onChange={(e) => handleChange("bgColor", e.target.value)}
            />
            <span className={styles.hint}>(Override global)</span>
          </div>
        </div>
      )}
    </div>
  );
};
