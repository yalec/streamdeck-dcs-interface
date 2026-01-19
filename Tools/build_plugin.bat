:: Build script for streamdeck-dcs.
:: Instructions: You must call this file from the "Developer Command Prompt for VS"
::               For details see https://docs.microsoft.com/en-us/cpp/build/building-on-the-command-line

:: Change directory to the project root (directory above this batch file location)
cd /D "%~dp0"\..

:: Set MSBuild path
set "MSBUILD_PATH=C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"

:: Detect available Platform Toolset (prefer v143 for GitHub Actions compatibility, fallback to v145 for local VS2026)
set "TOOLSET_OVERRIDE="
if exist "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VC\v180\Platforms\x64\PlatformToolsets\v143\" (
    echo Using v143 toolset ^(VS2022 compatible^)
) else (
    echo v143 toolset not found, using v145 ^(local VS build^) - Note: vcxproj files remain v143 for GitHub Actions
    set "TOOLSET_OVERRIDE=/p:PlatformToolset=v145"
)

:: Restore NuGet packages
"%MSBUILD_PATH%" .\Sources\backend-cpp\Windows\com.ctytler.dcs.sdPlugin.sln /t:Restore /p:RestorePackagesConfig=true
if %errorlevel% neq 0 echo "Canceling plugin build due to failure to restore NuGet packages" && pause && exit /b %errorlevel%

:: Build C++ executable (excluding tests):
"%MSBUILD_PATH%" .\Sources\backend-cpp\StreamdeckInterface\StreamdeckInterface.vcxproj /p:Configuration="Release" /p:Platform="x64" %TOOLSET_OVERRIDE%
if %errorlevel% neq 0 echo "Canceling plugin build due to failed backend build" && pause && exit /b %errorlevel%

:: Skip unit tests (Google Test not configured)
echo. && echo *** Skipping unit tests (gtest not configured) *** && echo.

:: Copy C++ executable and DLLs to StreamDeck Plugin package:
echo. && echo *** C++ binary compilation complete, published to Sources/com.ctytler.dcs.sdPlugin/bin/ *** && echo.
copy Sources\backend-cpp\StreamdeckInterface\x64\Release\streamdeck_dcs_interface.exe Sources\com.ctytler.dcs.sdPlugin\bin\
copy Sources\backend-cpp\StreamdeckInterface\x64\Release\*.dll Sources\com.ctytler.dcs.sdPlugin\bin\

:: Remove any prior build of the Plugin:
echo. && echo *** Removing any previous builds of com.ctytler.dcs.streamDeckPlugin from Release/ ***
del Release\com.ctytler.dcs.streamDeckPlugin && echo ...Successfully removed

:: Build the ReactJS user interface:
echo. && echo *** Building React JS interface (Settings + Property Inspectors) ***
cd Sources\frontend-react-js && call npm install && call npm run build
if %errorlevel% neq 0 echo "Canceling plugin build due to failed React build" && cd ..\..\ && pause && exit /b %errorlevel%
cd ..\..
echo *** React JS build complete ***
echo   - Settings UI: com.ctytler.dcs.sdPlugin/settingsUI/
echo   - Encoder PI:   com.ctytler.dcs.sdPlugin/propertyinspector/encoder-react/
echo   - Button PI:    com.ctytler.dcs.sdPlugin/propertyinspector/button-react/
echo   - DCS-BIOS PI:  com.ctytler.dcs.sdPlugin/propertyinspector/dcsbios-react/
echo.

:: Build StreamDeck Plugin:
echo *** Building com.ctytler.dcs.streamDeckPlugin to Release/ *** && echo.
Tools\DistributionTool.exe -b -i Sources\com.ctytler.dcs.sdPlugin -o Release
echo. && echo  *** Build complete *** && echo.

:: Pause for keypress to allow user to view output
pause

:: Plugin installer named "com.ctytler.dcs.streamDeckPlugin" will be output to Release/ directory
