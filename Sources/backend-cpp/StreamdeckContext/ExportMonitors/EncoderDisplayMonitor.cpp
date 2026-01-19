// Copyright 2021 Charles Tytler

#include "EncoderDisplayMonitor.h"

#include "StreamdeckContext/SendActions/EncoderAction.h"
#include "Utilities/StringUtilities.h"

namespace
{
    struct ValueMapping
    {
        std::string text;
        std::string image_path;
        std::string text_color;
        std::string bg_color;
    };

    // Parse the encoder_value_text_mapping setting for a specific DCS value
    // Format: "value1:text1:image1:textColor1:bgColor1;value2:text2:image2:textColor2:bgColor2;..."
    std::optional<ValueMapping> parseValueMapping(const std::string &dcs_value, const json &settings)
    {
        const std::string mapping_str = EPLJSONUtils::GetStringByName(settings, "encoder_value_text_mapping");
        if (mapping_str.empty()) {
            return std::nullopt;
        }

        // Split by semicolon to get individual mappings
        std::vector<std::string> entries;
        size_t start = 0;
        size_t end = mapping_str.find(';');
        
        while (end != std::string::npos) {
            entries.push_back(mapping_str.substr(start, end - start));
            start = end + 1;
            end = mapping_str.find(';', start);
        }
        entries.push_back(mapping_str.substr(start)); // Add last entry

        // Find matching entry for the current DCS value
        for (const auto &entry : entries) {
            if (entry.empty()) continue;

            // Split by colon: value:text:image
            size_t first_colon = entry.find(':');
            if (first_colon == std::string::npos) continue;

            std::string entry_value = entry.substr(0, first_colon);
            
            // Check if this entry matches the current DCS value
            if (entry_value == dcs_value) {
                ValueMapping result;
                
                size_t second_colon = entry.find(':', first_colon + 1);
                if (second_colon != std::string::npos) {
                    result.text = entry.substr(first_colon + 1, second_colon - first_colon - 1);
                    
                    size_t third_colon = entry.find(':', second_colon + 1);
                    if (third_colon != std::string::npos) {
                        result.image_path = entry.substr(second_colon + 1, third_colon - second_colon - 1);
                        
                        // Extended format with colors: value:text:image:textColor:bgColor
                        size_t fourth_colon = entry.find(':', third_colon + 1);
                        if (fourth_colon != std::string::npos) {
                            result.text_color = entry.substr(third_colon + 1, fourth_colon - third_colon - 1);
                            result.bg_color = entry.substr(fourth_colon + 1);
                        } else {
                            // Format: value:text:image:textColor
                            result.text_color = entry.substr(third_colon + 1);
                        }
                    } else {
                        // Format: value:text:image
                        result.image_path = entry.substr(second_colon + 1);
                    }
                } else {
                    // Old format: value:text (backwards compatibility)
                    result.text = entry.substr(first_colon + 1);
                }
                
                return result;
            }
        }

        return std::nullopt;
    }
} // namespace

EncoderDisplayMonitor::EncoderDisplayMonitor(const json &settings) { update_settings(settings); }

void EncoderDisplayMonitor::update_settings(const json &settings)
{
    // Settings are always valid once initialized
    settings_are_valid_ = true;
}

std::optional<EncoderDisplayData> EncoderDisplayMonitor::determineEncoderDisplay(
    SendActionInterface *send_action, SimulatorInterface *simulator_interface, const json &settings) const
{
    if (!send_action) {
        return std::nullopt;
    }

    // Check if this is an EncoderAction
    auto *encoder_action = dynamic_cast<EncoderAction *>(send_action);
    if (!encoder_action) {
        return std::nullopt;
    }

    // Get the current display value from the encoder action
    const std::string current_value = encoder_action->getCurrentDisplayValue(simulator_interface, settings);
    if (current_value.empty()) {
        return std::nullopt;
    }

    // Create the display data structure
    EncoderDisplayData display_data;
    
    // Parse value mappings to determine display content (text, image, or both)
    const auto mapping_result = parseValueMapping(current_value, settings);
    
    if (mapping_result.has_value()) {
        const auto &mapping = mapping_result.value();
        
        // Priority: if image is specified, use it as icon; otherwise use text as value
        if (!mapping.image_path.empty()) {
            display_data.icon = mapping.image_path;
            
            // If text is also specified, use it as title
            if (!mapping.text.empty()) {
                display_data.title = mapping.text;
            }
        } else if (!mapping.text.empty()) {
            display_data.value = mapping.text;
        } else {
            display_data.value = current_value; // Fallback to raw value
        }
        
        // Apply per-value color overrides if specified
        if (!mapping.text_color.empty()) {
            display_data.text_color = mapping.text_color;
        }
        if (!mapping.bg_color.empty()) {
            display_data.bg_color = mapping.bg_color;
        }
    } else {
        display_data.value = current_value; // No mapping found, use raw value
    }
    
    // Apply global layout settings from encoder display settings
    const std::string bg_image = EPLJSONUtils::GetStringByName(settings, "encoder_background_image");
    if (!bg_image.empty()) {
        display_data.background = bg_image;
    }
    
    const std::string alignment = EPLJSONUtils::GetStringByName(settings, "encoder_text_alignment");
    if (!alignment.empty()) {
        display_data.alignment = alignment;
    }
    
    const std::string text_color = EPLJSONUtils::GetStringByName(settings, "encoder_text_color");
    if (!text_color.empty() && !display_data.text_color.has_value()) {
        display_data.text_color = text_color; // Use global color if not overridden
    }
    
    const std::string font_size_str = EPLJSONUtils::GetStringByName(settings, "encoder_font_size");
    if (!font_size_str.empty()) {
        try {
            display_data.font_size = std::stoi(font_size_str);
        } catch (...) {}
    }
    
    const std::string font_weight_str = EPLJSONUtils::GetStringByName(settings, "encoder_font_weight");
    if (!font_weight_str.empty()) {
        try {
            display_data.font_weight = std::stoi(font_weight_str);
        } catch (...) {}
    }
    
    const std::string opacity_str = EPLJSONUtils::GetStringByName(settings, "encoder_opacity");
    if (!opacity_str.empty()) {
        try {
            display_data.opacity = std::stod(opacity_str);
        } catch (...) {}
    }
    
    display_data.indicator = calculateIndicator(simulator_interface, settings);

    return display_data;
}

std::optional<int> EncoderDisplayMonitor::calculateIndicator(SimulatorInterface *simulator_interface,
                                                             const json &settings) const
{
    // Extract min/max/monitor settings
    const auto min_str = EPLJSONUtils::GetStringByName(settings, "increment_min");
    const auto max_str = EPLJSONUtils::GetStringByName(settings, "increment_max");
    const auto dcs_id_str = EPLJSONUtils::GetStringByName(settings, "dcs_id_increment_monitor");

    // Validate all required fields are present
    if (min_str.empty() || max_str.empty() || !is_integer(dcs_id_str)) {
        return std::nullopt;
    }

    try {
        double min_val = std::stod(min_str);
        double max_val = std::stod(max_str);
        int dcs_id = std::stoi(dcs_id_str);

        // Get current value from simulator
        auto maybe_current = simulator_interface->get_value_at_addr(dcs_id);
        if (!maybe_current.has_value()) {
            return std::nullopt;
        }

        double current = std::stod(maybe_current.value().str());

        // Calculate percentage (0-100)
        double range = max_val - min_val;
        if (range <= 0) {
            return std::nullopt;
        }

        double percentage = ((current - min_val) / range) * 100.0;

        // Clamp to 0-100
        if (percentage < 0.0)
            percentage = 0.0;
        if (percentage > 100.0)
            percentage = 100.0;

        return static_cast<int>(percentage);
    } catch (...) {
        // Ignore errors in indicator calculation
        return std::nullopt;
    }
}
