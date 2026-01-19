# StreamdeckContext Library
add_library(StreamdeckContext STATIC
    BackwardsCompatibilityHandler.cpp
    BackwardsCompatibilityHandler.h
    StreamdeckContext.cpp
    StreamdeckContext.h
    ExportMonitors/EncoderDisplayMonitor.cpp
    ExportMonitors/EncoderDisplayMonitor.h
    ExportMonitors/ImageStateMonitor.cpp
    ExportMonitors/ImageStateMonitor.h
    ExportMonitors/IncrementMonitor.cpp
    ExportMonitors/IncrementMonitor.h
    ExportMonitors/TitleMonitor.cpp
    ExportMonitors/TitleMonitor.h
    SendActions/EncoderAction.cpp
    SendActions/EncoderAction.h
    SendActions/IncrementAction.cpp
    SendActions/IncrementAction.h
    SendActions/MomentaryAction.cpp
    SendActions/MomentaryAction.h
    SendActions/SendActionFactory.cpp
    SendActions/SendActionFactory.h
    SendActions/SendActionInterface.h
    SendActions/SwitchAction.cpp
    SendActions/SwitchAction.h
)

target_include_directories(StreamdeckContext PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(StreamdeckContext PUBLIC
    Utilities
    SimulatorInterface
)
