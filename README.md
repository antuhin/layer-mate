# CleanLayer — File Cleanup & Smart Rename

> A lightweight Figma plugin that helps designers clean up messy files before developer handoff.

![Plugin Cover](https://github.com/antuhin/layer-mate/raw/main/cover.png)

---

## 🎯 What It Does

**CleanLayer** gives you 4 powerful tools in one compact panel:

| Tab | What It Does |
|-----|-------------|
| 🔍 **Scan** | Instant file health check — counts hidden, locked, unnamed & empty layers |
| ✏️ **Rename** | Smart layer renaming with Atomic Design, BEM, Slash, and more |
| 🧹 **Cleanup** | One-click removal of hidden layers, empty frames & redundant wrappers |
| ✅ **QA** | Quality audit — contrast issues, small fonts, touch targets & a health score |

---

## 🚀 Features

### 🔍 Scan Tab
- Count **total layers, hidden layers, locked layers, unnamed layers**
- Detect **empty frames/groups** and **deeply nested layers**
- Calculate a **File Health Score (0–100)**
- Click any metric to **select those layers** on canvas

### ✏️ Rename Tab
- **Auto Rename** with multiple naming conventions:
  - Atomic Design (`Atom`, `Molecule`, `Organism`)
  - Slash Structure (`Button / Primary`)
  - BEM Style (`button__primary`)
  - Component Library (PascalCase)
  - Architect Mode (semantic layout naming)
- Choose **casing**: PascalCase, kebab-case, camelCase, snake_case, UPPER_CASE
- Filter: skip hidden layers, skip locked layers, only rename default names
- **Undo** support — safely revert renames

### 🧹 Cleanup Tab
- **Remove hidden layers** (with preview count before deleting)
- **Remove redundant wrappers** — ungroup single-child frames
- **Remove empty frames/groups**
- **Unlock all layers** in selection
- Configurable: Auto-zoom to affected layers

### ✅ QA Tab
- **Detached Color Audit** — find fills/strokes not linked to styles or variables
- **Quality Audit** — detect:
  - Poor text contrast (WCAG 2.1 AA)
  - Fonts below 12px
  - Touch targets under 44×44px
  - Default/unnamed layers
- Visual **Health Score ring** with error breakdown
- Click any error → jumps to the layer on canvas

---

## 📦 Installation

### From Figma Community
1. Open **Figma Desktop**
2. Go to **Plugins** → **Browse plugins in Community**
3. Search for **CleanLayer**
4. Click **Install**

### For Developers (Local)
1. Clone this repository:
   ```bash
   git clone https://github.com/antuhin/layer-mate.git
   ```
2. Open **Figma Desktop**
3. Go to **Plugins** → **Development** → **Import plugin from manifest**
4. Select the `manifest.json` file
5. Plugin appears under **Plugins** → **Development** → **CleanLayer**

---

## 🎨 How to Use

### Basic Workflow
1. **Open your Figma file**
2. **Run the plugin**: Plugins → CleanLayer
3. **Pick a tab** and take action

### Tips

**Scan first**: Always start with the Scan tab to understand your file's health before making changes.

**Rename with a convention**: Select frames or layers, choose your naming pattern, and click "Apply Auto Rename". The plugin skips components and instances to protect your design system.

**Safe cleanup**: Cleanup actions show a preview count before deleting anything. Always review the count before confirming.

**QA before handoff**: Run the QA audit before sharing with developers. Aim for 80+ health score.

---

## 🏗️ Technical Details

### File Structure
```
layer-mate/
├── manifest.json   — Plugin configuration
├── code.js         — Backend logic (Figma Plugin API)
└── ui.html         — UI (HTML + CSS + JS, all inline)
```

### Technology Stack
- **Backend**: Vanilla JavaScript using the Figma Plugin API
- **Frontend**: Single-file `ui.html` with embedded CSS and JS
- **Fonts**: Inter (Google Fonts)
- **Theme**: Respects Figma's light/dark theme via `themeColors: true`

### Architecture
- Plugin UI (`ui.html`) sends messages to backend (`code.js`) via `parent.postMessage`
- Backend processes Figma API calls and responds via `figma.ui.postMessage`
- User settings and last-active tab are persisted with `figma.clientStorage`

---

## 🛣️ Roadmap

- [ ] Auto-link detached colors to nearest matching style
- [ ] Export QA audit as Markdown/PDF
- [ ] Batch rename with find & replace
- [ ] Multi-page scan support

---

## 🤝 Contributing

Issues and pull requests are welcome!

1. Fork the repository
2. Make your changes to `code.js` or `ui.html`
3. Test in Figma (Plugins → Development → CleanLayer → Run)
4. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/antuhin/layer-mate/issues)
- **Community**: Leave a review in [Figma Community](https://www.figma.com/community)

---

**Made with ❤️ for the design community.**
