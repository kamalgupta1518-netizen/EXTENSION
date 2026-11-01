# Contributing to Antigravity New Tab

Thank you for your interest in contributing to **Antigravity New Tab**! We appreciate your help in making this extension faster, more customizable, and more enjoyable for everyone.

---

## 📌 Code of Conduct

Please be respectful, constructive, and helpful to all contributors and community members.

---

## 🚀 How to Contribute

### 1. Reporting Bugs
- Check the [Issues](../../issues) tab to see if the bug has already been reported.
- If not, create a new issue detailing:
  - Clear steps to reproduce the behavior.
  - Expected vs. actual behavior.
  - Browser and version (e.g. Chrome 124 on Windows 11).
  - Any relevant console errors or screenshots.

### 2. Suggesting Enhancements
- Open a feature request describing the proposed feature and why it would be beneficial.
- Provide mockups or design references if applicable.

### 3. Submitting Pull Requests (PRs)
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/antigravity-new-tab.git
   ```
3. **Create a new branch** with a descriptive name:
   ```bash
   git checkout -b feature/my-cool-feature
   ```
4. **Make your changes** cleanly. Ensure vanilla ES6+ compatibility without introducing heavy external runtime dependencies.
5. **Test in Chrome**: Load the unpacked extension at `chrome://extensions/` and test your modifications.
6. **Commit your changes**:
   ```bash
   git commit -m "Add feature: customizable alarm chime sounds"
   ```
7. **Push to your fork and submit a PR** against the `main` branch.

---

## 💻 Coding Standards
- Write clean, readable vanilla JavaScript (ES6+).
- Maintain responsive glassmorphism CSS styling and CSS variables in `style.css`.
- Keep the extension fast, lightweight, and offline-capable.
