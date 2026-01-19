/**
 * Property Inspector Settings Types
 * Extended from existing StreamdeckButtonSettings
 */

// Encoder-specific settings - accept both string and number for backwards compatibility
export interface EncoderSettings extends Record<string, unknown> {
  button_id?: string | number;
  device_id?: string | number;
  // Rotation settings
  dcs_id_increment_monitor?: string | number;
  increment_cw?: string | number;
  increment_ccw?: string | number;
  increment_min?: string | number;
  increment_max?: string | number;
  increment_cycle_allowed_check?: boolean;
  // Press settings
  encoder_press_value?: string | number;
  // Display settings
  encoder_value_text_mapping?: string;  // Serialized: "value:text:image:textColor:bgColor"
}

// Value mapping for encoder display
export interface ValueMapping {
  id: string;
  dcsValue: string;
  displayText: string;
  displayImage: string;
  textColor?: string;
  bgColor?: string;
}
