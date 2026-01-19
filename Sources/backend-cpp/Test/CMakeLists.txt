# Test Executable
add_executable(StreamDeckDCSTests
    MockESDConnectionManager.h
    # Utilities tests
    ../Utilities/test/DecimalTest.cpp
    ../Utilities/test/JsonReaderTest.cpp
    ../Utilities/test/LuaReaderTest.cpp
    ../Utilities/test/StringUtilitiesTest.cpp
    ../Utilities/test/UdpSocketTest.cpp
    # SimulatorInterface tests
    ../SimulatorInterface/test/SimConnectionManagerTest.cpp
    ../SimulatorInterface/test/SimulatorInterfaceTest.cpp
    ../SimulatorInterface/Protocols/test/DcsBiosProtocolTest.cpp
    ../SimulatorInterface/Protocols/test/DcsBiosStreamParserTest.cpp
    ../SimulatorInterface/Protocols/test/DcsExportScriptProtocolTest.cpp
    # StreamdeckContext tests
    ../StreamdeckContext/test/BackwardsCompatibilityHandlerTest.cpp
    ../StreamdeckContext/test/StreamdeckContextTest.cpp
    ../StreamdeckContext/ExportMonitors/test/EncoderDisplayMonitorTest.cpp
    ../StreamdeckContext/ExportMonitors/test/ImageStateMonitorTest.cpp
    ../StreamdeckContext/ExportMonitors/test/IncrementMonitorTest.cpp
    ../StreamdeckContext/ExportMonitors/test/TitleMonitorTest.cpp
    ../StreamdeckContext/SendActions/test/IncrementActionTest.cpp
    ../StreamdeckContext/SendActions/test/MomentaryActionTest.cpp
    ../StreamdeckContext/SendActions/test/SendActionFactoryTest.cpp
    ../StreamdeckContext/SendActions/test/SwitchActionTest.cpp
)

target_include_directories(StreamDeckDCSTests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(StreamDeckDCSTests PRIVATE
    Utilities
    SimulatorInterface
    ElgatoSD
    StreamdeckContext
    GTest::gtest
    GTest::gtest_main
)

# Register tests with CTest
include(GoogleTest)
gtest_discover_tests(StreamDeckDCSTests)
