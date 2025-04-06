# Website Time Manager Chrome Extension

A powerful productivity-focused Chrome extension designed to help users manage their time spent on distracting websites and stay focused on their tasks.

## Features

### Website Time Management
- Set customizable time limits for distracting websites
- Block access to websites after the time limit is reached
- Add and manage multiple websites to monitor
- Toggle website blocking on/off with a single switch
- Option to block all tabs or specific websites

### Task Management
- Create and manage tasks with subtasks
- Mark tasks and subtasks as complete
- Organize tasks in an expandable/collapsible interface
- Delete tasks and subtasks as needed

### User Interface
- Clean and intuitive popup interface
- Easy-to-use controls for managing websites and tasks
- Real-time status updates
- Fullscreen mode for focused work sessions

## Installation

1. Download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar to open the popup interface
2. Toggle the extension on/off using the main switch
3. Set your desired time limit for distracting websites
4. Add websites you want to monitor
5. Create and manage your tasks
6. Use the fullscreen mode for focused work sessions

## Permissions

The extension requires the following permissions:
- `activeTab`: To monitor and manage current tabs
- `storage`: To save your settings and preferences
- `tabs`: To manage multiple tabs
- `scripting`: To implement website blocking functionality

## Technical Details

- Built using Chrome Extension Manifest V3
- Uses Chrome Storage API for data persistence
- Implements content scripts for website monitoring
- Background service worker for continuous operation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 