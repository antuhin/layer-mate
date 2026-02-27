# Layer Mate — Smart Layer Naming & File Cleanup for Figma

> Rename, clean, and audit your Figma layers in seconds.

![Plugin Cover](https://github.com/antuhin/layer-mate/raw/main/cover.png)

---

## 🎯 What It Does

**Layer Mate** gives you 4 powerful tools in one compact panel:

| Tab | What It Does |
|-----|-------------|
| 🔍 **Scan** | Instant file health check — counts hidden, locked, unnamed & empty layers |
| ✏️ **Rename** | Smart layer renaming with 4 naming conventions + live Preview Rename |
| 🧹 **Cleanup** | One-click removal of hidden layers, empty frames & redundant wrappers |
| ✅ **QA** | Contrast audit, small fonts, touch targets & a visual health score |

---

## ✏️ Naming Conventions

### 🧹 Auto Clean *(default)*
Depth-based structural names — great for general cleanup.
```
Frame 1   →  item
Group 3   →  container
Section   →  section
Page root →  block
```

### 🤝 Dev Ready
HTML semantic names — maps layers directly to web elements, perfect for developer handoff.
```
Horizontal frame     →  nav/bar
Full-width section   →  section/hero
Vector shape         →  icon/close
Image fill frame     →  img/banner
```

### 📚 Library
Figma slash notation — auto-groups variants for component libraries.
```
ButtonPrimary  →  Button / Primary
CardHero       →  Card / Hero
```

### 🧩 Semantic *(new)*
Detects real UI patterns from structure, shadow, stroke, and content — names that both designers and developers already know.

| Layer structure | Name |
|---|---|
| Horizontal top-level frame | `top-bar` |
| Narrow vertical frame | `side-panel` |
| VECTOR node | `icon` |
| Circle + image fill | `avatar` |
| Small pill-shaped frame | `badge` |
| Frame with drop shadow + image + content | `card` |
| Frame with shadow, small, rounded | `popup` |
| Bordered + large + rounded | `panel` |
| Frame with fill + padding + short text | `btn` |
| Same, with shadow | `cta-btn` |
| Stroke + empty + short height | `input` |
| Horizontal group | `row` |
| Vertical group | `stack` |

---

## 👁 Preview Rename

Before applying any rename, click **Preview Rename** to see exactly what will change:

1. Select your layers
2. Choose a convention
3. Click **👁 Preview Rename**
4. Review the Before → After list in the slide-up panel
5. Click **Apply All** or **Cancel**

Use **⚡** to rename directly without preview.

---

## 🔍 Scan Tab

- Count **total, hidden, locked, unnamed** layers
- Detect **empty frames** and **deeply nested** layers
- Visual **File Health Score (0–100)**
- Click any metric to **select affected layers** on canvas

---

## 🧹 Cleanup Tab

- **Remove hidden layers** — safely delete non-visible layers
- **Flatten wrappers** — ungroup redundant single-child frames
- **Remove empty frames/groups**
- **Unlock all layers** in selection

---

## ✅ QA Tab

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
3. Search **Layer Mate**
4. Click **Install**

### For Developers (Local)
```bash
git clone https://github.com/antuhin/layer-mate.git
```
1. Open Figma Desktop
2. **Plugins → Development → Import plugin from manifest**
3. Select `manifest.json`
4. Run via **Plugins → Development → Layer Mate**

---

## 🏗️ Technical Details

```
layer-mate/
├── manifest.json   — Plugin configuration
├── code.js         — Backend (Figma Plugin API)
└── ui.html         — UI (HTML + CSS + JS, inline)
```

- **Theme**: Respects Figma light/dark via `themeColors: true`
- **Undo**: Full undo support on all rename actions
- **Settings**: Preferences persisted via `figma.clientStorage`

---

## 🛣️ Roadmap

- [ ] Export QA audit as Markdown
- [ ] Multi-page scan support
- [ ] Auto-link detached colors to nearest style
- [ ] Naming consistency score in Scan tab

---

## 🤝 Contributing

1. Fork the repo
2. Edit `code.js` or `ui.html`
3. Test in Figma (Plugins → Development → Layer Mate → Run)
4. Open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

**Made with ❤️ for the design community.**
