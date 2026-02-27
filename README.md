# CleanUp Layers — Smart Rename & Cleanup for Figma

> Rename, clean, and audit your Figma layers in seconds.

![Plugin Cover](https://github.com/antuhin/layer-mate/raw/main/cover.png)

---

## 🎯 What It Does

**CleanUp Layers** has 3 tabs + a Settings panel:

| Tab | What It Does |
|-----|-------------|
| 🔍 **Scan** | File health check — counts hidden, locked, unnamed & empty layers |
| ✏️ **Rename** | 4 naming conventions, Preview Rename, and Cleanup Tools |
| 🛡️ **Audit** | Contrast, small fonts, touch targets, detached colors & health score |

---

## ✏️ Rename Tab

### Naming Conventions

Choose from 4 conventions in the **Convention** dropdown:

#### 🧹 Auto Clean *(default)*
Depth-based structural names — smart cleanup for any file.
```
Frame 1   →  item
Group 3   →  container
Section   →  section
```

#### 🤝 Dev Ready
HTML semantic names — maps layers to web elements for developer handoff.
```
Horizontal frame   →  nav
Full-width section →  section
Vector shape       →  icon
Image fill frame   →  img
```

#### 📚 Library
Figma slash notation — groups variants for component libraries.
```
ButtonPrimary  →  Button / Primary
CardHero       →  Card / Hero
```

#### 🧩 Semantic
Detects real UI patterns from structure, shadows, strokes, and fills.

| Layer structure | Name |
|---|---|
| Horizontal top-level frame | `top-bar` |
| Narrow vertical frame | `side-panel` |
| VECTOR / shape node | `icon` |
| Circle + image fill | `avatar` |
| Small pill-shaped frame | `badge` |
| Frame + shadow + image + content | `card` |
| Frame + shadow, small, rounded | `popup` |
| Frame + fill + padding + short text | `btn` |
| Stroke + empty + short height | `input` |
| Horizontal group | `row` |
| Vertical group | `stack` |

---

### Filters

- **Skip locked layers** — don't rename locked layers
- **Skip hidden layers** — don't rename hidden layers
- **Only rename defaults** — only rename layers with default names (Frame 1, Group 3…)

---

### Rename Buttons

- **Rename Layers** (big blue button) — applies rename immediately
- **👁** (icon button) — opens Preview panel to see Before → After before applying

### 👁 Preview Rename

1. Select layers on canvas
2. Choose a convention
3. Click **👁** to open the preview panel
4. Review the Before → After list
5. Click **Apply All** or **Cancel**

---

### Cleanup Tools

Four quick-action buttons inside the Rename tab:

| Button | Action |
|---|---|
| 🗑 Remove Hidden | Deletes all hidden layers in selection |
| 📦 Flatten Wrappers | Removes redundant single-child frames |
| 🔓 Unlock All Layers | Unlocks all locked layers in selection |
| 🚫 Empty Frames | Removes empty frames and groups |

---

## 🔍 Scan Tab

- Count **total, hidden, locked, unnamed** layers
- Detect **empty frames** and **deeply nested** layers
- Visual **File Health Score (0–100)**
- Click any metric to **select those layers** on canvas

---

## 🛡️ Audit Tab

- **Detached Color Audit** — find fills not linked to styles/variables
- **Contrast Audit** — detect WCAG 2.1 AA failures
- Detect **fonts below 12px** and **touch targets under 44×44px**
- Visual **health score ring** with error breakdown
- Click any issue → jumps to the layer on canvas

---

## 📦 Installation

### From Figma Community
1. Open **Figma Desktop**
2. Go to **Plugins → Browse plugins in Community**
3. Search **CleanUp Layers**
4. Click **Install**

### For Developers (Local)
```bash
git clone https://github.com/antuhin/layer-mate.git
```
1. Open Figma Desktop
2. **Plugins → Development → Import plugin from manifest**
3. Select `manifest.json`
4. Run via **Plugins → Development → CleanUp Layers**

---

## 🏗️ Technical Details

```
layer-mate/
├── manifest.json   — Plugin configuration
├── code.js         — Backend (Figma Plugin API)
└── ui.html         — UI (HTML + CSS + JS, single file)
```

- **documentAccess**: `dynamic-page` (current page only)
- **Theme**: Respects Figma light/dark via `themeColors: true`
- **Undo**: Full undo support on all rename actions
- **Persistence**: Last-used convention saved via `figma.clientStorage`

---

## 🛣️ Roadmap

- [ ] Multi-page scan support
- [ ] Export Audit report as Markdown
- [ ] Auto-link detached colors to nearest style
- [ ] Naming consistency score in Scan tab

---

## 🤝 Contributing

1. Fork the repo
2. Edit `code.js` or `ui.html`
3. Test in Figma (Plugins → Development → CleanUp Layers → Run)
4. Open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

**Made with ❤️ for the design community.**
