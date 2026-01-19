import React from "react";
import { ValueMappingRow, ValueMappingData } from "./ValueMappingRow";
import styles from "./ValueMappingList.module.css";

interface ValueMappingListProps {
  mappings: ValueMappingData[];
  onChange: (mappings: ValueMappingData[]) => void;
}

export const ValueMappingList: React.FC<ValueMappingListProps> = ({ mappings, onChange }) => {
  const handleAdd = () => {
    const newMapping: ValueMappingData = {
      id: `mapping_${Date.now()}`,
      dcsValue: "",
      displayText: "",
      displayImage: "",
      textColor: "",
      bgColor: ""
    };
    onChange([...mappings, newMapping]);
  };

  const handleMappingChange = (id: string, updatedMapping: ValueMappingData) => {
    onChange(mappings.map(m => m.id === id ? updatedMapping : m));
  };

  const handleDelete = (id: string) => {
    onChange(mappings.filter(m => m.id !== id));
  };

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <h4>Value Mappings</h4>
        <button className={styles.btnAdd} onClick={handleAdd}>
          + Add
        </button>
      </div>

      <div className={styles.container}>
        {mappings.length === 0 ? (
          <div className={styles.empty}>
            No mappings defined. Click "+ Add" to create one.
          </div>
        ) : (
          mappings.map(mapping => (
            <ValueMappingRow
              key={mapping.id}
              mapping={mapping}
              onChange={handleMappingChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <div className={styles.info}>
        Define how DCS values should be displayed on the encoder LCD.
        Use the ⚙ button for advanced color settings.
      </div>
    </div>
  );
};
