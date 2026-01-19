# Utilities Library
add_library(Utilities STATIC
    Decimal.cpp
    Decimal.h
    JsonReader.cpp
    JsonReader.h
    LuaReader.cpp
    LuaReader.h
    StringUtilities.cpp
    StringUtilities.h
    UdpSocket.cpp
    UdpSocket.h
)

target_include_directories(Utilities PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
)

# Link nlohmann_json
target_link_libraries(Utilities PUBLIC
    nlohmann_json::nlohmann_json
)

# Link Lua if available
if(Lua_FOUND)
    target_include_directories(Utilities PUBLIC ${LUA_INCLUDE_DIR})
    target_link_libraries(Utilities PUBLIC ${LUA_LIBRARIES})
elseif(DEFINED LUA_INCLUDE_DIR AND DEFINED LUA_LIBRARIES)
    target_include_directories(Utilities PUBLIC ${LUA_INCLUDE_DIR})
    target_link_libraries(Utilities PUBLIC ${LUA_LIBRARIES})
else()
    message(WARNING "Lua not found. Please set LUA_INCLUDE_DIR and LUA_LIBRARIES manually if build fails.")
endif()

# Windows networking libraries
if(WIN32)
    target_link_libraries(Utilities PUBLIC ws2_32)
endif()
