<img src="Images/DCS_Interface_Banner.png" width=400>

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/enertial/streamdeck-dcs-interface/cpp-tests.yml?label=C%2B%2B%20Tests)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/enertial/streamdeck-dcs-interface/reactjs-tests.yml?label=ReactJS%20Tests)
[![codecov](https://codecov.io/gh/charlestytler/streamdeck-dcs-interface/branch/master/graph/badge.svg?token=9K0CA0IGSM)](https://codecov.io/gh/charlestytler/streamdeck-dcs-interface)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/enertial/streamdeck-dcs-interface/clang-format.yml?label=clang-format)
![GitHub all releases](https://img.shields.io/github/downloads/enertial/streamdeck-dcs-interface/total)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/enertial/streamdeck-dcs-interface)

`DCS Interface` is a plugin for the Streamdeck that allows communication with DCS via lua UDP sockets for both receiving updates of the simulation state as well as sending commands to interact with the clickable cockpits.

- [Description](#description)
  - [Detailed Documentation](#detailed-documentation)
- [Demo of Operation](#demo-of-operation)
- [Installation](#installation)
    - [Downloads](#downloads)
    - [Version Update](#version-update)
      - [Identify installed version number:](#identify-installed-version-number)
    - [Initial Configuration](#initial-configuration)
    - [Video Walkthrough](#video-walkthrough)
- [Source code](#source-code)
- [Build from source instructions](#build-from-source-instructions)

# Description

`DCS Interface` is a plugin that allows you to create buttons and interfaces that update with DCS events.
There are currently three settings for each Streamdeck button you create:

- DCS Command - Specify which button/switch you want to activate in game (allows setting of any clickable object in a cockpit).
  - Streamdeck buttons support push-button, switch, and increment (dials, levers, etc.) input types.
  - **Stream Deck Plus rotary encoders** support rotation with separate CW/CCW increment values and encoder press for fixed values.
- Image Change Settings - Specify a function within the DCS simulation to monitor and change the display of the Streamdeck image conditionally.
  - Examples: Lamps for Warnings/Modes, Switch states
- Title Text Change Settings - Specify a function in the DCS simulation which will be monitored and its text is displayed as the Streamdeck button Title.
  - Examples: UFC text displays, scratchpads, radio displays

Can also support multiple physical Streamdecks at once, including **Stream Deck Plus** with rotary encoder support.

## Community Aircraft Modules

The plugin supports both **official DCS modules** and **community aircraft modules** installed in your DCS Saved Games directory.

### Configuration

When using the **ID Lookup** window to find control IDs:

1. **DCS World Install Directory**: Path to your DCS installation (e.g., `C:\Program Files\Eagle Dynamics\DCS World`)
   - This is where official modules are located
   
2. **DCS Saved Games Directory**: Path to your DCS saved games folder (e.g., `%userprofile%\Saved Games\DCS`)
   - This is where community modules are typically installed
   - Leave empty if you don't use community modules

The plugin will automatically:
- Scan both directories for installed aircraft modules
- Merge the module lists for easy access
- Search both locations when loading clickabledata for a selected module

This allows seamless integration of community aircraft alongside official modules in your Stream Deck configuration.

## Stream Deck Plus Encoder Features

The plugin now supports **Stream Deck Plus rotary encoders** with the following capabilities:

- **Rotation Control**: Separate clockwise (CW) and counter-clockwise (CCW) increment values per tick
- **Press Action**: Send a fixed value when pressing the encoder button
- **LCD Display**: Real-time display of DCS values on the encoder LCD screen
- **Value Mapping**: Map numeric DCS values to custom text (e.g., "0.2" → "OFF", "0.8" → "ARMED")
- **Automatic Gauge**: Visual indicator bar based on minimum/maximum value ranges
- **Live Updates**: Changes to mappings take effect immediately without restart

Configure encoders using the dedicated Property Inspector with intuitive controls for all settings.

## Detailed Documentation

More detailed instructions can be found in: [Settings Help Documentation](Sources/com.ctytler.dcs.sdPlugin/helpDocs/helpContents.md).

---

# Demo of Operation

![Stream Deck AV8BNA ODU Demo](Images/Streamdeck_AV8B_Demo.gif)

**Example of Settings to Display Master Caution Lamp:**

<img src="Images/Configuration_AV8B_Screenshot.jpg" width=600>

# Installation

### Downloads

- For the DCS plugin to work you will first need [DCS-ExportScripts](https://github.com/asherao/DCS-ExportScripts) installed, detailed instructions are on their [Wiki](https://github.com/s-d-a/DCS-ExportScripts/wiki). This is the backend that is relied on for communication with the DCS game.

- To install the DCS Interface Streamdeck plugin, you will need to download and run the installer `com.ctytler.dcs.streamDeckPlugin` from [Releases](https://github.com/charlestytler/streamdeck-dcs-interface/releases).

- Also within [Releases](https://github.com/charlestytler/streamdeck-dcs-interface/releases) is an optional `icon_library.zip` you can download for use with Streamdeck Profiles.

### Version Update

If you have a prior version already installed on your StreamDeck, you will have to uninstall it first before installing the latest version. To do this right-click on one of the DCS Interface button types in the right-side panel and click "Uninstall".

#### Identify installed version number:
To see the version of the plugin installed on the StreamDeck, right-click on one of the DCS Interface button types in the right-side panel.

### Initial Configuration

If you plan to only use DCS Interface for Streamdeck with the DCS-ExportScript and not [Ikarus](https://github.com/s-d-a/Ikarus), you can modify the file `DCS-ExportScript\Config.lua` to have the following settings (where `IkarusPort` is changed from `1625` to `1725` for DCS Interface) to get everything connected:

```
-- Ikarus a Glass Cockpit Software
ExportScript.Config.IkarusExport    = true         -- false for not use
ExportScript.Config.IkarusHost      = "127.0.0.1"  -- IP for Ikarus
ExportScript.Config.IkarusPort      = 1725         -- Port Ikarus (1625)
ExportScript.Config.IkarusSeparator = ":"
```

If you are interested in using the export script to support both Streamdeck and Ikarus, instructions can be found in the [Settings Help Documentation - Enabling Both DCS Interface & Ikarus](Sources/com.ctytler.dcs.sdPlugin/helpDocs/helpContents.md#enabling-both-dcs-interface--ikarus).

### Video Walkthrough

A walkthrough of installation and configuration can be found at the below link, along with other instructional videos.  
[DCS Interface for Streamdeck Video Instructions](https://www.youtube.com/playlist?list=PLcYO7a2ywThz7nIT4CjRTn737ZM26aqDq)

# Source code

The Sources folder contains the source code of the plugin. The primary components are as follows:

```
Sources
├── com.ctytler.dcs.sdPlugin  Plugin package where the built frontend and backend are combined
│   ├── manifest.json           Definition of Streamdeck plugin metadata
│   ├── bin                     Location for compiled C++ and lua scripts called by plugin
│   ├── helpDocs                Help documentation within plugin
│   ├── images                  Default icon images
│   └── propertyinspector       Javascript and html used by plugin (Button settings and windows)
├── backend-cpp               The backend of the plugin (Manages Simulator/Streamdeck State), written in C++
│   ├── ElgatoSD                Elgato Streamdeck SDK source and utilities
│   ├── SimulatorInterface      Classes for interacting with the simulator state
│   ├── StreamdeckContext       Classes for maintaining state of individual Streamdeck buttons
│   │   ├── ExportMonitors      Classes that monitor simulator export data for individual buttons
│   │   ├── SendActions         Classes that define button press and release actions
│   ├── StreamdeckInterface     Executable that interfaces C++ code with Streamdeck plugin
│   ├── Test                    Unit test infrastructure and target
│   ├── Utilities               Generic utilities for UDP socket and string manipulation
│   ├── Vendor                  Third party source code
│   └── Windows                 Visual Studio solution settings
└── frontend-react-js         The frontend of the plugin (Configuration window), written in ReactJS
```

# Build from source instructions

## CMake Build (Recommended)

The project now supports **CMake** for easier, version-independent builds with automatic dependency management.

### Quick Start

**Windows (Release):**
```batch
Tools\build_plugin_cmake.bat
```

This will:
- Build both C++ backend and React frontend
- Run all unit tests
- Generate the plugin file at `Release/com.ctytler.dcs.streamDeckPlugin`

**Windows (Debug Mode):**
```batch
Tools\build_plugin_cmake.bat -debug
```

Debug mode will:
- Build with source maps for JavaScript/React debugging
- Link plugin to Stream Deck in development mode
- Enable Stream Deck developer mode
- Restart the plugin automatically
- Access Property Inspector debugging at `http://localhost:23654/`
- Attach Visual Studio debugger to `com.ctytler.dcs.exe` for C++ debugging

### Manual CMake Build

```batch
cd Sources\backend-cpp
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022" -A x64
cmake --build . --config Release
```

**For Debug builds:**
```batch
cmake --build . --config Debug
```

See [Sources/backend-cpp/BUILD_CMAKE.md](Sources/backend-cpp/BUILD_CMAKE.md) for detailed CMake documentation.

## Legacy MSBuild Method

The original MSBuild script is still available: `Tools/build_plugin.bat`

Before running the .bat file you will need to:
 - Install MSBuild to compile C++ (comes with Microsoft Visual Studio or Build Tools)
 - Install npm for Windows
 - Add your install location of MSBuild.exe to your PATH environment variable:
   - Click start button to search and select "Edit environment variables for your account"
   - Under "User variables for ..." select the "Path" row and choose "Edit"
   - Add a New path of your MSBuild.exe install location, such as "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin"

**Build Requirements:**
- Visual Studio 2022 (Platform Toolset v143) or newer
- npm for Windows
- C++17 compiler support
