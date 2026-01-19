# Building with CMake

This project now supports CMake for easier, version-independent builds!

## Why CMake?

- **Version Independent**: Works with any modern Visual Studio (2019, 2022, 2026+)
- **Cross-platform**: Can build on Windows, Linux, macOS
- **Automatic dependency management**: Downloads missing dependencies
- **CI/CD friendly**: Perfect for GitHub Actions

## Quick Start

### Windows (Easy Method)

Simply run the CMake build script:
```batch
Tools\build_plugin_cmake.bat
```

### Manual CMake Build

1. **Create build directory**:
   ```batch
   cd Sources\backend-cpp
   mkdir build
   cd build
   ```

2. **Configure**:
   ```batch
   cmake .. -G "Visual Studio 17 2022" -A x64
   ```
   
   Or for older VS:
   ```batch
   cmake .. -G "Ninja" -DCMAKE_BUILD_TYPE=Release
   ```

3. **Build**:
   ```batch
   cmake --build . --config Release
   ```

## Dependencies

CMake will automatically download and configure:
- **nlohmann_json** (automatically fetched from GitHub)
- **Google Test** (automatically fetched for tests)

You still need to provide **Lua 5.4**:

### Option 1: Install Lua via vcpkg
```batch
vcpkg install lua:x64-windows
cmake .. -DCMAKE_TOOLCHAIN_FILE=<vcpkg-root>/scripts/buildsystems/vcpkg.cmake
```

### Option 2: Manual Lua paths
```batch
cmake .. -DLUA_INCLUDE_DIR=C:/path/to/lua/include -DLUA_LIBRARIES=C:/path/to/lua/lib/lua54.lib
```

### Option 3: Use NuGet packages (current method)
The build script will restore Lua from NuGet packages if you use the old MSBuild method.

## Build Options

- **BUILD_TESTS**: Enable/disable test suite (ON by default)
  ```batch
  cmake .. -DBUILD_TESTS=OFF
  ```

- **CMAKE_BUILD_TYPE**: Debug or Release
  ```batch
  cmake .. -DCMAKE_BUILD_TYPE=Debug
  ```

## Compatibility

### Visual Studio Versions
- ✅ Visual Studio 2022 (v143)
- ✅ Visual Studio 2026 (v145)
- ✅ Any version with C++17 support

### Old MSBuild Method
The original MSBuild files are still available:
```batch
Tools\build_plugin.bat
```

## Troubleshooting

### "Lua not found" error
See dependencies section above for Lua installation options.

### "Generator not found" error
Install Visual Studio or use Ninja:
```batch
choco install ninja
cmake .. -G "Ninja"
```

### GitHub Actions
CMake works perfectly with GitHub Actions:
```yaml
- name: Configure CMake
  run: cmake -B build -S Sources/backend-cpp

- name: Build
  run: cmake --build build --config Release
```

## Migration Notes

The CMake build produces the same output as MSBuild:
- Executable: `streamdeck_dcs_interface.exe`
- Output location: Automatically copied to `Sources/com.ctytler.dcs.sdPlugin/bin/`
- All libraries are statically linked

## For Contributors

When adding new source files:
1. Add them to the appropriate `CMakeLists.txt` in the module folder
2. No need to modify `.vcxproj` files anymore
3. CMake automatically detects and builds all listed files
