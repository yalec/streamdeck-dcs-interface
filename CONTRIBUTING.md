# Contributing to DCS Interface

Thank you for your interest in contributing to this project!

## Fork Information

This fork adds the following enhancements to the original project:

### Key Features Added

1. **Stream Deck Plus Rotary Encoder Support**
   - Full encoder rotation with CW/CCW increment values
   - Encoder press actions for fixed values
   - LCD display with real-time DCS value updates
   - See [ENCODER_PRESS_IMPLEMENTATION.md](ENCODER_PRESS_IMPLEMENTATION.md) for details

2. **MOVABLE_LEV Class Type Support**
   - Added support for `MOVABLE_LEV` (class type 5) in clickabledata parsing
   - Fixes ID Lookup for aircraft using movable lever controls (F4U-1D Corsair, etc.)
   - Proper extraction of `gain` values for lever increment controls
   - See [MOVABLE_LEV_SUPPORT.md](MOVABLE_LEV_SUPPORT.md) for technical details

### Original Project

- Original Repository: [charlestytler/streamdeck-dcs-interface](https://github.com/charlestytler/streamdeck-dcs-interface)
- License: GNU General Public License v3.0

## How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** (`git checkout -b feature/my-new-feature`)
4. **Make your changes** and commit them with clear messages
5. **Test your changes** thoroughly
6. **Push to your fork** (`git push origin feature/my-new-feature`)
7. **Submit a Pull Request** to the original repository

## Development Guidelines

### Frontend Architecture (React + TypeScript)

The plugin uses **React 17 + TypeScript** for all UI components. See [Sources/frontend-react-js/ARCHITECTURE.md](Sources/frontend-react-js/ARCHITECTURE.md) for detailed documentation.

**Quick Start:**
```bash
cd Sources/frontend-react-js
npm install
npm run build:all  # Build all Property Inspectors
```

**Key Principles:**
- **TypeScript strict mode**: No `any` types
- **Functional components**: Use hooks (useState, useEffect, useCallback)
- **postMessage API**: For inter-window communication
- **CSS Modules**: For scoped component styling
- **Type safety**: All settings interfaces properly typed

### Building from Source

Before building, ensure you have:
- Microsoft Visual Studio 2022 (or Build Tools with Platform Toolset v143)
- npm for Windows
- (Optional) CMake 3.15+ for CMake builds

**Recommended: CMake build (C++ backend + React frontend):**
```batch
cd Tools
.\build_plugin_cmake.bat
```

**For Debug builds:**
```batch
cd Sources\backend-cpp\build
cmake --build . --config Debug
```

**Legacy MSBuild method:**
```batch
cd Tools
.\build_plugin.bat
```

**Frontend only:**
```batch
cd Sources/frontend-react-js
npm run build:all
```

See [Sources/backend-cpp/BUILD_CMAKE.md](Sources/backend-cpp/BUILD_CMAKE.md) for detailed build documentation.

### Code Style

- C++: Follow existing code conventions in the project
- JavaScript/HTML: Use consistent indentation and formatting
- Add comments for complex logic

### Testing

- Test all functionality with actual Stream Deck hardware
- Verify DCS integration with multiple aircraft modules
- Run unit tests before submitting (`Test.exe` generated during build)

## Reporting Issues

When reporting issues, please include:
- Stream Deck model and firmware version
- DCS World version
- Steps to reproduce the issue
- Expected vs actual behavior
- Any error messages or logs

## License

By contributing, you agree that your contributions will be licensed under the GNU General Public License v3.0, consistent with the original project.

## Acknowledgments

This project builds upon the excellent work of the original author and contributors. All modifications respect the original GPL-3.0 license terms.
