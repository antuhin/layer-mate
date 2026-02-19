# Layer Mate: Career OS

> A unified Design Ops tool that guides designers through 4 stages of career maturity via 4 distinct functional modules.

## 🎯 Overview

**Layer Mate: Career OS** is a comprehensive Figma plugin that teaches design thinking while solving real workflow problems. Each module represents a different career stage and focuses on the skills needed at that level.

## 🚀 The 4 Modules

### ⚡ Module 1: The Cleaner (Junior Level)
**Focus**: Speed & Efficiency

Automatically rename layers using Atomic Design principles. Learn proper naming conventions while working fast.

**Features**:
- Auto-rename text layers to their content
- Apply Atomic Design methodology (Atom/Molecule/Organism)
- Support for PascalCase and kebab-case
- Protects component masters and instances

**Why it matters**: Juniors need to work efficiently while learning best practices. This automates tedious renaming while teaching design hierarchy.

---

### 🎨 Module 2: The Tokenizer (Senior Level)
**Focus**: System Thinking

Find colors that aren't linked to your design system. Identify technical debt before it spreads.

**Features**:
- Scan for raw HEX codes in fills and strokes
- Detect colors not linked to Variables or Styles
- Visual color swatches with HEX values
- Layer-by-layer breakdown

**Why it matters**: Seniors enforce design systems. Detached colors create inconsistency and technical debt that compounds over time.

---

### 🛡️ Module 3: The Linter (Lead Level)
**Focus**: Quality Control

Run comprehensive quality audits on your designs. Catch accessibility and organization issues.

**Features**:
- Check for missing alt text on images
- Detect default layer names (Frame, Group, etc.)
- Basic text contrast checking
- Health score (0-100) with categorized errors

**Why it matters**: Leads ensure quality across teams. This audit catches common mistakes that hurt accessibility and maintainability.

---

### 🚀 Module 4: The Handoff Manager (Manager Level)
**Focus**: Process & Scalability

Add visual status indicators to frames for better dev handoff communication.

**Features**:
- Three status levels: 🔴 Draft, 🟡 In Review, 🟢 Ready for Dev
- Auto-layout status pills
- Color-coded visual indicators
- Automatic positioning at frame top

**Why it matters**: Managers track progress across multiple designers. Status pills improve communication with developers and stakeholders.

---

## 📦 Installation

### For Users
1. Open Figma Desktop
2. Go to **Plugins** → **Browse plugins in Community**
3. Search for "Layer Mate: Career OS"
4. Click **Install**

### For Developers
1. Clone this repository
2. Open Figma Desktop
3. Go to **Plugins** → **Development** → **Import plugin from manifest**
4. Select the `manifest.json` file
5. Plugin appears in **Plugins** → **Development** → **Layer Mate: Career OS**

---

## 🎨 Usage

### Basic Workflow
1. **Select layers** in your Figma canvas
2. **Open plugin**: Plugins → Layer Mate: Career OS
3. **Choose module**: Click one of the 4 tabs
4. **Run action**: Click the primary button
5. **Review results**: See toast notification and/or results

### Module-Specific Tips

**Module 1 (Clean)**:
- Select entire frames for bulk renaming
- Choose PascalCase for components, kebab-case for instances
- Text layers will be renamed to their content

**Module 2 (Tokens)**:
- Select your entire design or specific sections
- Review the color list and link to styles
- Use this before finalizing designs

**Module 3 (QA & Lint)**:
- Run on complete screens before handoff
- Aim for 80+ health score
- Fix errors in order of severity

**Module 4 (Handoff)**:
- Select frames/artboards (not individual layers)
- Update status as design progresses
- Status pills are automatically positioned

---

## 🏗️ Technical Architecture

### File Structure
```
Layer Mate/
├── manifest.json    # Plugin configuration
├── code.js          # Backend logic (Figma Plugin API)
└── ui.html          # Frontend UI (HTML/CSS/JS)
```

### Technology Stack
- **Backend**: Vanilla JavaScript (Figma Plugin API)
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Design**: Custom design system with dark mode
- **Fonts**: Inter (Google Fonts)

### Key Design Patterns
- **Separation of Concerns**: UI handles clicks, backend handles logic
- **Modular Functions**: Each module is self-contained
- **State Persistence**: Uses `figma.clientStorage` for tab memory
- **Error Handling**: Try-catch with user-friendly messages

---

## 🎓 Educational Philosophy

Each module includes extensive comments explaining:
- **Why** this matters at that career level
- **What** problem it solves
- **How** it teaches design thinking

Example:
```javascript
// ========================================
// MODULE 2: THE TOKENIZER (SENIOR LEVEL)
// Career Stage: Senior Designer
// Focus: System Thinking
// Why: Seniors enforce design systems. Detached colors create
// technical debt and inconsistency. This module helps identify
// raw HEX codes that should be linked to design tokens/variables.
// ========================================
```

---

## 🛠️ Development

### Prerequisites
- Figma Desktop App
- Basic knowledge of JavaScript
- Understanding of Figma Plugin API

### Local Development
1. Make changes to `code.js` or `ui.html`
2. In Figma: **Plugins** → **Development** → **Layer Mate: Career OS** → **Run**
3. Test changes in the plugin UI
4. Reload plugin to see updates

### Code Style
- Use educational comments for all major functions
- Follow existing naming conventions
- Maintain separation between UI and backend logic
- Add error handling for all user-facing actions

---

## 🎯 Roadmap

### Planned Enhancements
- [ ] **Module 2**: Add "Fix" button to auto-link colors to styles
- [ ] **Module 3**: WCAG contrast ratio calculations
- [ ] **Module 4**: Custom status options and colors
- [ ] **All Modules**: Batch operations and undo support
- [ ] **New Module**: Component Auditor (Principal level)

### Community Requests
- Export audit reports as CSV
- Integration with design system libraries
- Custom naming templates
- Multi-language support

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments

Built with ❤️ for the design community.

Special thanks to:
- The Figma Plugin API team
- The Atomic Design methodology by Brad Frost
- All designers who provided feedback

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/layer-mate-career-os/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/layer-mate-career-os/discussions)
- **Email**: support@layermate.com

---

## 🌟 Show Your Support

If this plugin helps your workflow, please:
- ⭐ Star this repository
- 🐦 Share on Twitter
- 💬 Leave a review in Figma Community
- 🤝 Contribute improvements

---

**Made with ⚡ by designers, for designers.**
