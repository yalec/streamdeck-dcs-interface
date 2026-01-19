// Copyright 2021 Charles Tytler

#pragma once

#include "ElgatoSD/EPLJSONUtils.h"
#include "SimulatorInterface/SimulatorInterface.h"

#include <optional>
#include <string>

// Forward declaration to avoid circular dependency
class SendActionInterface;

struct EncoderDisplayData
{
    std::string value;                      // Text value to display
    std::optional<int> indicator;           // Optional gauge value (0-100)
    std::optional<std::string> icon;        // Optional icon path (data URI or file path)
    std::optional<std::string> title;       // Optional title text
    std::optional<std::string> background;  // Optional background image path
    std::optional<std::string> text_color;  // Optional text color (hex format)
    std::optional<std::string> bg_color;    // Optional background color (hex format)
    std::optional<std::string> alignment;   // Optional text alignment (center/left/right)
    std::optional<int> font_size;           // Optional font size
    std::optional<int> font_weight;         // Optional font weight
    std::optional<double> opacity;          // Optional opacity (0.0 to 1.0)
};

class EncoderDisplayMonitor
{
  public:
    EncoderDisplayMonitor() = default;
    EncoderDisplayMonitor(const json &settings);

    /**
     * @brief Updates internal monitor conditions based on user settings.
     *
     * @param settings Json settings from Streamdeck property inspector.
     */
    void update_settings(const json &settings);

    /**
     * @brief Determines what the encoder display should show according to current game state.
     *
     * @param send_action Pointer to the send action to get display value from.
     * @param simulator_interface Interface to request current game state from.
     * @param settings Json settings for the context.
     * @return EncoderDisplayData containing the display value and optional indicator percentage.
     */
    std::optional<EncoderDisplayData> determineEncoderDisplay(SendActionInterface *send_action,
                                                              SimulatorInterface *simulator_interface,
                                                              const json &settings) const;

  private:
    /**
     * @brief Calculates the indicator (gauge) percentage based on min/max/current values.
     *
     * @param simulator_interface Interface to request current game state from.
     * @param settings Json settings containing min, max, and monitor DCS ID.
     * @return Optional indicator value (0-100) if calculation is successful.
     */
    std::optional<int> calculateIndicator(SimulatorInterface *simulator_interface, const json &settings) const;

    bool settings_are_valid_ = false; // True if settings have been initialized.
};
