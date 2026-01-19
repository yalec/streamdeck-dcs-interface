# SimulatorInterface Library
add_library(SimulatorInterface STATIC
    SimConnectionManager.cpp
    SimConnectionManager.h
    SimulatorInterface.cpp
    SimulatorInterface.h
    SimulatorInterfaceParameters.h
    SimulatorProtocolTypes.h
    Protocols/DcsBiosProtocol.cpp
    Protocols/DcsBiosProtocol.h
    Protocols/DcsBiosStreamParser.cpp
    Protocols/DcsBiosStreamParser.h
    Protocols/DcsExportScriptProtocol.cpp
    Protocols/DcsExportScriptProtocol.h
)

target_include_directories(SimulatorInterface PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(SimulatorInterface PUBLIC
    Utilities
)
