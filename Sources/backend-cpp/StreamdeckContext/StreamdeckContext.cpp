// Copyright 2020 Charles Tytler

#include "StreamdeckContext.h"

#include "StreamdeckContext/SendActions/EncoderAction.h"
#include "StreamdeckContext/SendActions/SendActionFactory.h"

#include "ElgatoSD/EPLJSONUtils.h"

StreamdeckContext::StreamdeckContext(const std::string &action, const std::string &context, const json &settings)
    : context_{context}, send_action_(SendActionFactory().create(action))
{
    protocol_ = (action == "com.ctytler.dcs.dcs-bios") ? Protocol::DCS_BIOS : Protocol::DCS_ExportScript;
    updateContextSettings(settings);
}

bool StreamdeckContext::is_valid() { return (send_action_ != nullptr); }

Protocol StreamdeckContext::protocol() { return protocol_; }

void StreamdeckContext::updateContextState(SimulatorInterface *simulator_interface,
                                           ESDConnectionManager *mConnectionManager)
{

    const auto updated_state = comparison_monitor_.determineContextState(simulator_interface);
    const auto updated_title = title_monitor_.determineTitle(simulator_interface);

    if (updated_state != current_state_) {
        current_state_ = updated_state;
        mConnectionManager->SetState(current_state_, context_);
    }
    if (updated_title != current_title_) {
        current_title_ = updated_title;
        mConnectionManager->SetTitle(current_title_, context_, kESDSDKTarget_HardwareAndSoftware);
    }

    // Update encoder display using the encoder display monitor
    const auto maybe_encoder_display =
        encoder_display_monitor_.determineEncoderDisplay(send_action_.get(), simulator_interface, settings_);

    if (maybe_encoder_display.has_value()) {
        const auto &display_data = maybe_encoder_display.value();
        json feedback;
        
        // Build feedback object based on what's available
        // Use nested structure for complex properties as per Elgato docs
        
        // Set value (text to display with styling)
        if (!display_data.value.empty()) {
            json value_obj;
            value_obj["value"] = display_data.value;
            
            // Apply text styling if specified
            if (display_data.text_color.has_value()) {
                value_obj["color"] = display_data.text_color.value();
            }
            if (display_data.alignment.has_value()) {
                value_obj["alignment"] = display_data.alignment.value();
            }
            if (display_data.font_size.has_value() || display_data.font_weight.has_value()) {
                json font_obj;
                if (display_data.font_size.has_value()) {
                    font_obj["size"] = display_data.font_size.value();
                }
                if (display_data.font_weight.has_value()) {
                    font_obj["weight"] = display_data.font_weight.value();
                }
                value_obj["font"] = font_obj;
            }
            if (display_data.opacity.has_value()) {
                value_obj["opacity"] = display_data.opacity.value();
            }
            
            feedback["value"] = value_obj;
        }

        // Set optional indicator (gauge)
        if (display_data.indicator.has_value()) {
            json indicator_obj;
            indicator_obj["value"] = display_data.indicator.value();
            feedback["indicator"] = indicator_obj;
        }
        
        // Set optional icon (replaces text if specified)
        if (display_data.icon.has_value()) {
            json icon_obj;
            icon_obj["value"] = display_data.icon.value();
            if (display_data.opacity.has_value()) {
                icon_obj["opacity"] = display_data.opacity.value();
            }
            feedback["icon"] = icon_obj;
        }
        
        // Set optional title
        if (display_data.title.has_value()) {
            json title_obj;
            title_obj["value"] = display_data.title.value();
            if (display_data.text_color.has_value()) {
                title_obj["color"] = display_data.text_color.value();
            }
            feedback["title"] = title_obj;
        }
        
        // Set optional background (color or image)
        if (display_data.background.has_value()) {
            feedback["background"] = display_data.background.value();
        } else if (display_data.bg_color.has_value()) {
            feedback["background"] = display_data.bg_color.value();
        }

        // Track changes for debugging/logging
        std::string current_display_signature = display_data.value;
        if (display_data.icon.has_value()) {
            current_display_signature += "|icon:" + display_data.icon.value();
        }
        
        if (current_display_signature != last_encoder_display_value_) {
            last_encoder_display_value_ = current_display_signature;
        }
        
        mConnectionManager->SetFeedback(feedback, context_);
    }

    if (delay_for_force_send_state_) {
        if (delay_for_force_send_state_.value()-- <= 0) {
            mConnectionManager->SetState(current_state_, context_);
            delay_for_force_send_state_.reset();
        }
    }
}

void StreamdeckContext::forceSendState(ESDConnectionManager *mConnectionManager)
{
    mConnectionManager->SetState(current_state_, context_);
}

void StreamdeckContext::forceSendStateAfterDelay(const int delay_count)
{
    delay_for_force_send_state_.emplace(delay_count);
}

void StreamdeckContext::updateContextSettings(const json &settings)
{
    settings_ = settings;
    comparison_monitor_.update_settings(settings);
    title_monitor_.update_settings(settings);
    encoder_display_monitor_.update_settings(settings);
}

void StreamdeckContext::handleButtonPressedEvent(SimulatorInterface *simulator_interface,
                                                 ESDConnectionManager *mConnectionManager,
                                                 const json &inPayload)
{
    send_action_->handleButtonPressedEvent(simulator_interface, mConnectionManager, inPayload);
}

void StreamdeckContext::handleButtonReleasedEvent(SimulatorInterface *simulator_interface,
                                                  ESDConnectionManager *mConnectionManager,
                                                  const json &inPayload)
{
    send_action_->handleButtonReleasedEvent(simulator_interface, mConnectionManager, inPayload);

    // The Streamdeck will by default change a context's state after a KeyUp event, so a force send of the current
    // context's state will keep the button state in sync with the plugin.
    if (send_action_->delay_send_state()) {
        forceSendStateAfterDelay(NUM_FRAMES_DELAY_FORCED_STATE_UPDATE);
    } else {
        forceSendState(mConnectionManager);
    }
}

void StreamdeckContext::handleEncoderRotation(SimulatorInterface *simulator_interface,
                                             ESDConnectionManager *mConnectionManager,
                                             const json &inPayload,
                                             int ticks)
{
    // Cast to EncoderAction to access encoder-specific methods
    auto *encoder_action = dynamic_cast<EncoderAction *>(send_action_.get());
    if (encoder_action) {
        // Create a new payload with stored settings
        json payload_with_settings = inPayload;
        payload_with_settings["settings"] = settings_;
        
        encoder_action->handleEncoderRotation(simulator_interface, mConnectionManager, payload_with_settings, ticks);
    }
}

void StreamdeckContext::handleEncoderPress(SimulatorInterface *simulator_interface,
                                          ESDConnectionManager *mConnectionManager,
                                          const json &inPayload)
{
    // Cast to EncoderAction to access encoder-specific methods
    auto *encoder_action = dynamic_cast<EncoderAction *>(send_action_.get());
    if (encoder_action) {
        // Create a new payload with stored settings
        json payload_with_settings = inPayload;
        payload_with_settings["settings"] = settings_;
        
        encoder_action->handleEncoderPress(simulator_interface, mConnectionManager, payload_with_settings);
    }
    
    // Force send state update after encoder press
    forceSendState(mConnectionManager);
}
