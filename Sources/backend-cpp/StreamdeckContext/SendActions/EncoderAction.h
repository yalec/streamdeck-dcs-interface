// Copyright 2021 Charles Tytler

#pragma once

#include "StreamdeckContext/ExportMonitors/IncrementMonitor.h"
#include "StreamdeckContext/SendActions/SendActionInterface.h"

#include <optional>
#include <string>

class EncoderAction : public SendActionInterface
{
  public:
    EncoderAction() = default;

    /**
     * @brief Button events are not used for encoder actions.
     */
    void handleButtonPressedEvent(SimulatorInterface *simulator_interface,
                                  ESDConnectionManager *mConnectionManager,
                                  const json &inPayload) override;

    void handleButtonReleasedEvent(SimulatorInterface *simulator_interface,
                                   ESDConnectionManager *mConnectionManager,
                                   const json &inPayload) override;

    /**
     * @brief Handles encoder rotation event with direction (positive = clockwise, negative = counter-clockwise).
     *
     * @param simulator_interface Interface to simulator containing current game state.
     * @param mConnectionManager Interface to StreamDeck.
     * @param inPayload Json payload received with encoder rotation callback.
     * @param ticks Number of rotation ticks (positive = clockwise, negative = counter-clockwise).
     */
    void handleEncoderRotation(SimulatorInterface *simulator_interface,
                              ESDConnectionManager *mConnectionManager,
                              const json &inPayload,
                              int ticks);

    /**
     * @brief Handles encoder press to set a fixed value.
     *
     * @param simulator_interface Interface to simulator containing current game state.
     * @param mConnectionManager Interface to StreamDeck.
     * @param inPayload Json payload received with encoder press callback.
     */
    void handleEncoderPress(SimulatorInterface *simulator_interface,
                           ESDConnectionManager *mConnectionManager,
                           const json &inPayload);

    /**
     * @brief Returns the current display value for the encoder LCD.
     *
     * @param simulator_interface Interface to simulator containing current game state.
     * @param settings Json settings from Streamdeck property inspector.
     * @return Current value as string, or empty string if not available.
     */
    std::string getCurrentDisplayValue(SimulatorInterface *simulator_interface, const json &settings);

    /**
     * @brief Returns the current image path for the encoder background.
     *
     * @param simulator_interface Interface to simulator containing current game state.
     * @param settings Json settings from Streamdeck property inspector.
     * @return Image path as string, or empty string if not available.
     */
    std::string getCurrentImagePath(SimulatorInterface *simulator_interface, const json &settings);

  private:
    IncrementMonitor increment_monitor_{}; // Monitors DCS ID to track current state for incremental changes.
};
