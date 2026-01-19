cmake_minimum_required(VERSION 3.15)

project(StreamDeckDCSInterface
    VERSION 1.0.0
    LANGUAGES CXX
)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Build type
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Choose the type of build." FORCE)
endif()

# Output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Global include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/Vendor/asio/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/Vendor/websocketpp)

# Windows specific settings
if(WIN32)
    add_definitions(-DUNICODE -D_UNICODE)
    add_definitions(-D_WIN32_WINNT=0x0601) # Windows 7 minimum for ASIO
    # Use ASIO and websocketpp in standalone mode (without Boost)
    add_definitions(-DASIO_STANDALONE)
    add_definitions(-D_WEBSOCKETPP_CPP11_STL_)
    add_definitions(-D_WEBSOCKETPP_CPP11_FUNCTIONAL_)
    add_definitions(-D_WEBSOCKETPP_CPP11_SYSTEM_ERROR_)
    add_definitions(-D_WEBSOCKETPP_CPP11_RANDOM_DEVICE_)
    add_definitions(-D_WEBSOCKETPP_CPP11_MEMORY_)
endif()

# Find or fetch dependencies
include(FetchContent)

# Lua - Try to find from NuGet packages first (Windows build compatibility)
# Note: WIN32 in CMake means "Windows platform" (not architecture-specific)
if(WIN32 AND EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/Windows/packages/lua.5.4.6")
    message(STATUS "Using Lua from NuGet packages")
    set(LUA_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/Windows/packages/lua.5.4.6/build/native/include")
    
    # Detect platform architecture
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(LUA_ARCH "x64")
    else()
        set(LUA_ARCH "Win32")
    endif()
    
    # Try v143 first (VS2022 - for GitHub Actions compatibility), then fallback to other versions
    set(LUA_TOOLSET_VERSIONS "v143" "v142" "v141" "v140")
    foreach(TOOLSET ${LUA_TOOLSET_VERSIONS})
        set(LUA_LIB_PATH "${CMAKE_CURRENT_SOURCE_DIR}/Windows/packages/lua.5.4.6/build/native/lib/${LUA_ARCH}/${TOOLSET}/Release/lua_static.lib")
        if(EXISTS "${LUA_LIB_PATH}")
            set(LUA_LIBRARIES "${LUA_LIB_PATH}")
            message(STATUS "Found Lua library: ${LUA_ARCH}/${TOOLSET}")
            break()
        endif()
    endforeach()
    
    if(NOT LUA_LIBRARIES)
        message(WARNING "Lua NuGet package found but no compatible library version for ${LUA_ARCH}")
    else()
        set(Lua_FOUND TRUE)
    endif()
endif()

# Fallback to system Lua
if(NOT Lua_FOUND)
    find_package(Lua 5.4 QUIET)
    if(NOT Lua_FOUND)
        message(STATUS "Lua not found. Please either:")
        message(STATUS "  1. Restore NuGet packages (MSBuild will do this)")
        message(STATUS "  2. Set LUA_INCLUDE_DIR and LUA_LIBRARIES manually")
        message(STATUS "  3. Install Lua via vcpkg: vcpkg install lua:x64-windows")
    endif()
endif()

# nlohmann_json
find_package(nlohmann_json 3.11 QUIET)
if(NOT nlohmann_json_FOUND)
    message(STATUS "nlohmann_json not found, fetching from GitHub...")
    FetchContent_Declare(
        nlohmann_json
        URL https://github.com/nlohmann/json/releases/download/v3.11.2/json.tar.xz
    )
    FetchContent_MakeAvailable(nlohmann_json)
endif()

# Google Test (for tests)
option(BUILD_TESTS "Build test suite" ON)
if(BUILD_TESTS)
    find_package(GTest QUIET)
    if(NOT GTest_FOUND)
        message(STATUS "GTest not found, fetching from GitHub...")
        FetchContent_Declare(
            googletest
            URL https://github.com/google/googletest/archive/release-1.12.1.tar.gz
        )
        set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
        FetchContent_MakeAvailable(googletest)
    endif()
    enable_testing()
endif()

# Add subdirectories
add_subdirectory(Utilities)
add_subdirectory(SimulatorInterface)
add_subdirectory(ElgatoSD)
add_subdirectory(StreamdeckContext)
add_subdirectory(StreamdeckInterface)

if(BUILD_TESTS)
    add_subdirectory(Test)
endif()
