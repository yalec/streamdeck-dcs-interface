# StreamdeckInterface Executable
add_executable(streamdeck_dcs_interface
    main.cpp
    StreamdeckInterface.cpp
    StreamdeckInterface.h
)

target_include_directories(streamdeck_dcs_interface PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(streamdeck_dcs_interface PRIVATE
    Utilities
    SimulatorInterface
    ElgatoSD
    StreamdeckContext
)

# Windows specific linking
if(WIN32)
    target_link_libraries(streamdeck_dcs_interface PRIVATE
        ws2_32
        mswsock
    )
endif()

# Set output directory to match original build
set_target_properties(streamdeck_dcs_interface PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY_DEBUG "${CMAKE_BINARY_DIR}/bin"
    RUNTIME_OUTPUT_DIRECTORY_RELEASE "${CMAKE_BINARY_DIR}/bin"
)

# Copy executable to plugin directory after build
add_custom_command(TARGET streamdeck_dcs_interface POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
        $<TARGET_FILE:streamdeck_dcs_interface>
        ${CMAKE_SOURCE_DIR}/../com.ctytler.dcs.sdPlugin/bin/
    COMMENT "Copying executable to plugin directory"
)
