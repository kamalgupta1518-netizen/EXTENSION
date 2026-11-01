# 🌌 Antigravity New Tab

> A futuristic, glassmorphic Chrome New Tab extension engineered for peak productivity. Features draggable bookmark & task boards, a Pomodoro focus timer with weekly analytics, scheduled daily reminders with synthesized audio chimes, interactive zero-gravity physics, and high-performance video wallpapers.

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Modern%20Glassmorphism-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-00E599.svg)](LICENSE)

---

## ✨ Features

### 🗂️ 1. Draggable Bookmark & Task Boards
- **Kanban-Style Layout**: Organize links, tools, and to-do items into dedicated visual boards.
- **Task Management**: Mark items complete, categorize by urgency/tags (`Urgent`, `Work`, `Dev`, `Health`, `Daily`), and delete with one click.
- **Smart Favicons**: High-resolution icon resolution for popular developer and productivity sites.

### ⏱️ 2. Pomodoro Focus Timer & Weekly Tracker
- **Customizable Intervals**: Configurable Focus, Short Break, and Long Break durations.
- **Weekly Analytics**: Visual bar charts tracking total focus hours per day against a weekly goal.
- **Persistent State**: Background timer synchronization keeps your focus session accurate even across browser restarts.

### 🔔 3. Scheduled Alarms & Audio Chimes
- **Day-Specific Reminders**: Configure recurring alarms for specific days of the week.
- **Web Audio Chime Synthesizer**: Clean 4-tone harmonic chime with zero external audio assets required.
- **Desktop Notifications**: System-level notifications with interactive **Stop** and **Snooze (5m)** action buttons.
- **Cross-Tab Synchronization**: Stopping or snoozing an alarm synchronizes instantly across all open browser tabs and background workers.

### 🌌 4. Interactive Zero-Gravity Physics
- **Antigravity Mode**: Toggle zero-gravity particle and board physics that interact fluidly with cursor movement.
- **Dynamic Physics Engine**: Velocity, friction, and boundary collisions rendered on high-refresh HTML5 canvas.

### 🎨 5. Glassmorphism & Customization
- **Atmospheric Backgrounds**: Support for dynamic presets (Deep Space, Cyberpunk, Forest, Sunset, Aurora), custom image URLs, local image uploads, and live video backgrounds.
- **Audio & Video Voice Engine**: Video wallpapers with custom volume control and audio mute/unmute toggles.
- **Zen Mode (`Z` or `Esc`)**: Instantly hide all UI elements for an ultra-clean, distraction-free new tab view.
- **Custom Clock & Greetings**: 12h / 24h clock toggles, custom greeting messages, and milestone date countdowns.

---

## 📁 Project Structure

```text
├── 📄 manifest.json        # Extension Manifest V3 configuration & permissions
├── 📄 newtab.html          # Main HTML structure with glassmorphic layout & modals
├── 📄 script.js            # Frontend application logic, Web Audio engine, & state management
├── 📄 style.css            # Cyberpunk & Glassmorphism styles, responsive grid, & animations
├── 📄 background.js        # Background Service Worker for alarms & notification broadcasts
├── 📄 generate_icons.js    # Utility script to generate custom extension icons
├── 📁 icons/               # Extension icons (16x16, 48x48, 128x128)
├── 📄 .gitignore           # Git ignore rules for clean repository state
├── 📄 CONTRIBUTING.md      # Guidelines for contributing and reporting issues
└── 📄 LICENSE              # MIT License
```

---

## 🚀 Installation & Setup

### For Developers & Users:

1. **Clone or Download this repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/antigravity-new-tab.git
   ```
   *(Or download and extract the ZIP file)*

2. **Open Google Chrome (or any Chromium browser like Brave, Edge, Opera):**
   - Navigate to `chrome://extensions/` in your address bar.

3. **Enable Developer Mode:**
   - Toggle the **Developer mode** switch in the top-right corner.

4. **Load the Extension:**
   - Click **"Load unpacked"** in the top-left corner.
   - Select the folder containing this project (the directory where `manifest.json` is located).

5. **Open a New Tab:**
   - Press <kbd>Ctrl</kbd> + <kbd>T</kbd> (or <kbd>Cmd</kbd> + <kbd>T</kbd> on macOS) to enjoy your new tab!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>1</kbd> | Navigate to **Home** view |
| <kbd>2</kbd> | Navigate to **Boards & Tasks** view |
| <kbd>3</kbd> | Navigate to **Focus Timer** view |
| <kbd>4</kbd> | Navigate to **Scheduled Reminders** view |
| <kbd>Z</kbd> | Toggle **Zen Mode** (distraction-free view) |
| <kbd>Esc</kbd> | Close modals, exit Zen mode, or **Stop ringing alarm** |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | **Stop ringing alarm** immediately |

---

## 🛠️ Tech Stack & Architecture

- **Manifest V3 Architecture**: Secure service worker (`background.js`) managing persistent alarms via `chrome.alarms` and desktop alerts via `chrome.notifications`.
- **Web Audio API Engine**: Built-in multi-oscillator audio synthesizer for alarm chimes with zero external sound files.
- **Storage Layer**: Unified local state storage using `chrome.storage.local` with automatic fallback to `localStorage`.
- **IndexedDB**: High-performance local storage for offline custom image & video wallpapers.
- **HTML5 Canvas**: Interactive physics particle engine for zero-gravity floating effects.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](../../issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
