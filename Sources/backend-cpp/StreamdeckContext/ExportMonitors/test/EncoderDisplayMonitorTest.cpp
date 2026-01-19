// Copyright 2021 Charles Tytler

#include "gtest/gtest.h"

#include "SimulatorInterface/SimConnectionManager.h"
#include "StreamdeckContext/ExportMonitors/EncoderDisplayMonitor.h"
#include "StreamdeckContext/SendActions/EncoderAction.h"

namespace test
{

class EncoderDisplayMonitorTestFixture : public ::testing::Test
{
  public:
    EncoderDisplayMonitorTestFixture()
        : mock_dcs(connection_settings.ip_address, connection_settings.tx_port, connection_settings.rx_port)
    {
        sim_connection_manager.connect_to_protocol(Protocol::DCS_ExportScript, connection_settings);
        simulator_interface = sim_connection_manager.get_interface(Protocol::DCS_ExportScript);
        // Consume initial reset command sent to mock_dcs.
        (void)mock_dcs.receive_stream();
    }

    void set_current_dcs_id_value(const std::string &id, const std::string &value)
    {
        mock_dcs.send_string("header*" + id + "=" + value);
        simulator_interface->update_simulator_state();
    }

    SimulatorConnectionSettings connection_settings{"1908", "1909", "127.0.0.1"};
    UdpSocket mock_dcs;                      // A socket that will mock Send/Receive messages from DCS.
    SimulatorInterface *simulator_interface; // Simulator Interface to test.
  private:
    SimConnectionManager sim_connection_manager;
};

TEST_F(EncoderDisplayMonitorTestFixture, ReturnsNulloptForNonEncoderAction)
{
    EncoderDisplayMonitor monitor;
    json settings;
    
    // Test with nullptr
    auto result = monitor.determineEncoderDisplay(nullptr, simulator_interface, settings);
    EXPECT_FALSE(result.has_value());
}

TEST_F(EncoderDisplayMonitorTestFixture, ReturnsDisplayValueForEncoderAction)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        {"dcs_id_increment_monitor", "100"},
        {"increment_step_size", "1"},
        {"increment_min", "0"},
        {"increment_max", "10"}
    };
    
    // Set up the DCS value
    set_current_dcs_id_value("100", "5.0");
    
    // Create an EncoderAction
    auto encoder_action = std::make_unique<EncoderAction>();
    
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ("5", result.value().value);
}

TEST_F(EncoderDisplayMonitorTestFixture, CalculatesIndicatorPercentage)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        {"dcs_id_increment_monitor", "100"},
        {"increment_step_size", "1"},
        {"increment_min", "0"},
        {"increment_max", "100"}
    };
    
    // Set value to 50 (should be 50%)
    set_current_dcs_id_value("100", "50.0");
    
    auto encoder_action = std::make_unique<EncoderAction>();
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ("50", result.value().value);
    ASSERT_TRUE(result.value().indicator.has_value());
    EXPECT_EQ(50, result.value().indicator.value());
}

TEST_F(EncoderDisplayMonitorTestFixture, ClampsIndicatorToZero)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        {"dcs_id_increment_monitor", "100"},
        {"increment_step_size", "1"},
        {"increment_min", "10"},
        {"increment_max", "100"}
    };
    
    // Set value below minimum
    set_current_dcs_id_value("100", "5.0");
    
    auto encoder_action = std::make_unique<EncoderAction>();
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    ASSERT_TRUE(result.has_value());
    ASSERT_TRUE(result.value().indicator.has_value());
    EXPECT_EQ(0, result.value().indicator.value());
}

TEST_F(EncoderDisplayMonitorTestFixture, ClampsIndicatorTo100)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        {"dcs_id_increment_monitor", "100"},
        {"increment_step_size", "1"},
        {"increment_min", "0"},
        {"increment_max", "50"}
    };
    
    // Set value above maximum
    set_current_dcs_id_value("100", "75.0");
    
    auto encoder_action = std::make_unique<EncoderAction>();
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    ASSERT_TRUE(result.has_value());
    ASSERT_TRUE(result.value().indicator.has_value());
    EXPECT_EQ(100, result.value().indicator.value());
}

TEST_F(EncoderDisplayMonitorTestFixture, NoIndicatorWhenMinMaxNotProvided)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        {"dcs_id_increment_monitor", "100"},
        {"increment_step_size", "1"}
        // No increment_min or increment_max
    };
    
    set_current_dcs_id_value("100", "50.0");
    
    auto encoder_action = std::make_unique<EncoderAction>();
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ("50", result.value().value);
    EXPECT_FALSE(result.value().indicator.has_value());
}

TEST_F(EncoderDisplayMonitorTestFixture, NoIndicatorWhenRangeIsZero)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        {"dcs_id_increment_monitor", "100"},
        {"increment_step_size", "1"},
        {"increment_min", "50"},
        {"increment_max", "50"} // Same as min
    };
    
    set_current_dcs_id_value("100", "50.0");
    
    auto encoder_action = std::make_unique<EncoderAction>();
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    ASSERT_TRUE(result.has_value());
    EXPECT_FALSE(result.value().indicator.has_value());
}

TEST_F(EncoderDisplayMonitorTestFixture, HandlesEmptyDisplayValue)
{
    EncoderDisplayMonitor monitor;
    json settings = {
        // Missing required settings for increment action
    };
    
    auto encoder_action = std::make_unique<EncoderAction>();
    auto result = monitor.determineEncoderDisplay(encoder_action.get(), simulator_interface, settings);
    
    // Should return nullopt when display value is empty
    EXPECT_FALSE(result.has_value());
}

} // namespace test
