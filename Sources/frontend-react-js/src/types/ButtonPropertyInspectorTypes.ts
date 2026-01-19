// Types for Button Property Inspector settings (index.html replacement)

export interface ButtonSettings extends Record<string, unknown> {
  // DCS Command settings - accept both string and number for backwards compatibility
  button_id?: string | number;
  device_id?: string | number;
  send_address?: string;

  // Momentary button settings (press/release)
  press_value?: string | number;
  release_value?: string | number;
  disable_release_check?: boolean;

  // Switch button settings (two-state)
  send_when_first_state_value?: string | number;
  send_when_second_state_value?: string | number;

  // Increment button settings
  dcs_id_increment_monitor?: string | number;
  increment_value?: string | number;
  increment_min?: string | number;
  increment_max?: string | number;
  increment_cycle_allowed_check?: boolean;

  // Image State Change Monitor
  dcs_id_compare_monitor?: string | number;
  dcs_id_compare_condition?: "GREATER_THAN" | "EQUAL_TO" | "LESS_THAN";
  dcs_id_comparison_value?: string | number;

  // Title Text Change Monitor
  dcs_id_string_monitor?: string | number;
  string_monitor_vertical_spacing?: string | number;
  string_monitor_passthrough_check?: boolean;
  string_monitor_mapping?: string;
}

// Button action types detected from action UUID
export type ButtonActionType = "momentary" | "switch" | "increment";

export function getButtonActionType(actionUUID: string): ButtonActionType {
  if (actionUUID.includes("switch")) {
    return "switch";
  } else if (actionUUID.includes("increment")) {
    return "increment";
  }
  return "momentary";
}
