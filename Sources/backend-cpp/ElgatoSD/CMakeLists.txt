# ElgatoSD Library
add_library(ElgatoSD STATIC
    pch.cpp
    pch.h
    EPLJSONUtils.h
    ESDBasePlugin.h
    ESDConnectionManager.cpp
    ESDConnectionManager.h
    ESDLocalizer.cpp
    ESDLocalizer.h
    ESDSDKDefines.h
    ESDUtilities.h
    ESDUtilitiesWindows.cpp
)

target_include_directories(ElgatoSD PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(ElgatoSD PUBLIC
    Utilities
)

# Precompiled headers
target_precompile_headers(ElgatoSD PRIVATE pch.h)
