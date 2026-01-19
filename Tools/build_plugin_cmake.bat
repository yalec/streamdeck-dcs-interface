:: Build script for streamdeck-dcs using CMake
:: This script uses CMake for cross-platform, version-independent builds
:: Usage: build_plugin_cmake.bat [-debug]
::   -debug : After building, link and start the plugin with Stream Deck CLI in dev mode

:: Check for debug parameter
set "DEBUG_MODE=0"
if /I "%1"=="-debug" set "DEBUG_MODE=1"

:: Save original directory to return to it at the end
set "ORIGINAL_DIR=%CD%"

:: Change directory to the project root (directory above this batch file location)
cd /D "%~dp0"\..

echo ====================================
echo  StreamDeck DCS Interface - CMake Build
if "%DEBUG_MODE%"=="1" echo  [DEBUG MODE ENABLED]
echo ====================================
echo.

:: Detect Visual Studio installation using vswhere
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "%VSWHERE%" (
    echo ERROR: Visual Studio not found! Please install Visual Studio 2019 or later.
    echo Download from: https://visualstudio.microsoft.com/downloads/
    pause
    exit /b 1
)

:: Find the latest Visual Studio installation
for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
    set "VS_INSTALL_PATH=%%i"
)

if not defined VS_INSTALL_PATH (
    echo ERROR: Visual Studio with C++ tools not found!
    echo Please install "Desktop development with C++" workload.
    pause
    exit /b 1
)

echo Found Visual Studio at: %VS_INSTALL_PATH%

:: Initialize Visual Studio environment
set "VSCMD_START_DIR=%CD%"
if exist "%VS_INSTALL_PATH%\Common7\Tools\VsDevCmd.bat" (
    call "%VS_INSTALL_PATH%\Common7\Tools\VsDevCmd.bat" -no_logo -arch=x64
) else (
    echo ERROR: VsDevCmd.bat not found!
    pause
    exit /b 1
)

:: Find MSBuild
set "MSBUILD_PATH=%VS_INSTALL_PATH%\MSBuild\Current\Bin\MSBuild.exe"
if not exist "%MSBUILD_PATH%" (
    echo WARNING: MSBuild not found at expected location.
    echo Trying to use MSBuild from PATH...
    set "MSBUILD_PATH=msbuild.exe"
)

:: Restore NuGet packages first (for Lua)
echo.
echo *** Restoring NuGet packages for dependencies (Lua) ***
"%MSBUILD_PATH%" .\Sources\backend-cpp\Windows\com.ctytler.dcs.sdPlugin.sln /t:Restore /p:RestorePackagesConfig=true
if %errorlevel% neq 0 (
    echo WARNING: NuGet restore failed. CMake will try to find Lua elsewhere.
)
echo.

:: Set build directory
set "BUILD_DIR=Sources\backend-cpp\build"
set "CONFIG=Release"

:: Check if Lua is installed (optional, CMake will handle this)
:: You can set LUA_DIR if Lua is installed in a non-standard location
:: set "LUA_DIR=C:\Path\To\Lua"

:: Create build directory if it doesn't exist
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

:: Configure with CMake
echo *** Configuring project with CMake ***
cd "%BUILD_DIR%"

:: Use NMake Makefiles for simplicity
cmake .. -G "NMake Makefiles" -DCMAKE_BUILD_TYPE=%CONFIG%
if %errorlevel% neq 0 (
    echo.
    echo ERROR: CMake configuration failed!
    echo.
    echo Note: If you get errors about missing Lua, you can either:
    echo   1. Install Lua and add it to PATH
    echo   2. Set LUA_INCLUDE_DIR and LUA_LIBRARIES manually
    echo   3. Let CMake download nlohmann_json and GTest automatically
    echo.
    echo Also ensure you run this from "Developer Command Prompt for VS"
    echo.
    cd ..\..\..
    pause
    exit /b %errorlevel%
)

:: Build with CMake
echo.
echo *** Building project ***
nmake
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    cd ..\..\..
    pause
    exit /b %errorlevel%
)

:: Copy DLLs if needed (CMake post-build already copies the exe)
echo.
echo *** C++ binary compilation complete ***
echo Executable copied to Sources/com.ctytler.dcs.sdPlugin/bin/
cd ..\..\..

:: Remove any prior build of the Plugin
echo.
echo *** Removing any previous builds of com.ctytler.dcs.streamDeckPlugin from Release/ ***
if exist Release\com.ctytler.dcs.streamDeckPlugin (
    del Release\com.ctytler.dcs.streamDeckPlugin
    echo ...Successfully removed
)

:: Build the ReactJS user interface
echo.
if "%DEBUG_MODE%"=="1" (
    echo *** Building React JS interface in DEVELOPMENT mode ^(unminified, with source maps^) ***
) else (
    echo *** Building React JS interface ^(Settings + Property Inspectors^) ***
)
cd Sources\frontend-react-js
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    cd ..\..
    pause
    exit /b %errorlevel%
)

:: Set React build mode based on debug flag
if "%DEBUG_MODE%"=="1" (
    set "GENERATE_SOURCEMAP=true"
    call npm run build:all
) else (
    set "GENERATE_SOURCEMAP=false"
    call npm run build:all
)

if %errorlevel% neq 0 (
    echo ERROR: React build failed!
    cd ..\..
    pause
    exit /b %errorlevel%
)
cd ..\..
echo *** React JS build complete ***
echo   - Settings UI: com.ctytler.dcs.sdPlugin/settingsUI/
echo   - Encoder PI:   com.ctytler.dcs.sdPlugin/propertyinspector/encoder-react/
echo   - Button PI:    com.ctytler.dcs.sdPlugin/propertyinspector/button-react/
echo   - DCS-BIOS PI:  com.ctytler.dcs.sdPlugin/propertyinspector/dcsbios-react/
echo.

:: Build StreamDeck Plugin
echo *** Building com.ctytler.dcs.streamDeckPlugin to Release/ ***
echo.
Tools\DistributionTool.exe -b -i Sources\com.ctytler.dcs.sdPlugin -o Release

:: Check if the plugin was actually created instead of relying on errorlevel
if not exist "Release\com.ctytler.dcs.streamDeckPlugin" (
    echo ERROR: Plugin packaging failed! Output file not found.
    pause
    exit /b 1
)

echo.
echo ====================================
echo   BUILD COMPLETE!
echo ====================================
echo.
echo Plugin installer "com.ctytler.dcs.streamDeckPlugin" created in Release/ directory
echo.

:: If debug mode is enabled, link and start the plugin with Stream Deck CLI
if "%DEBUG_MODE%"=="1" (
    echo.
    echo ====================================
    echo   STARTING DEBUG MODE
    echo ====================================
    echo.
    
    :: Ensure we're in the project root directory
    cd /D "%~dp0\.."
    
    echo *** Linking plugin to Stream Deck ***
    streamdeck link Sources\com.ctytler.dcs.sdPlugin
    
    echo.
    echo *** Enabling developer mode ***
    streamdeck dev
    
    echo.
    echo *** Restarting plugin for debugging ***
    streamdeck restart com.ctytler.dcs
    
    echo.
    echo ====================================
    echo   DEBUG MODE ACTIVE
    echo ====================================
    echo.
    echo DEBUGGING PROPERTY INSPECTORS ^(React/HTML/JS^):
    echo   1. Open Chrome or Edge
    echo   2. Navigate to: http://localhost:23654/
    echo   3. Click on the Property Inspector you want to debug
    echo   4. Chrome DevTools will open with:
    echo      - Console for console.log^(^) output
    echo      - Sources tab for breakpoints ^(with source maps^)
    echo      - Network tab for WebSocket messages
    echo.
    echo DEBUGGING C++ BACKEND:
    echo   - Attach Visual Studio debugger to com.ctytler.dcs.exe
    echo   - Or check Stream Deck logs: %%APPDATA%%\Elgato\StreamDeck\logs\
    echo.
)

:: Return to original directory
cd /D "%ORIGINAL_DIR%"

:: Pause for keypress to allow user to view output
pause
