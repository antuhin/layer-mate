# Layer Mate: Career OS - Quick Reference

## 🎯 Quick Start

1. **Open Plugin**: Plugins → Layer Mate: Career OS
2. **Select Layers**: Choose layers in Figma
3. **Pick Module**: Click one of 4 tabs
4. **Run Action**: Click the button
5. **See Results**: Toast notification appears

---

## 📋 Module Cheat Sheet

### ⚡ Clean (Junior)
**What**: Auto-rename layers with Atomic Design  
**When**: After creating new designs  
**Select**: Any layers or frames  
**Result**: Renamed layers (Text → content, Frames → Container/Item)

### 🎨 Tokens (Senior)
**What**: Find detached colors  
**When**: Before finalizing designs  
**Select**: Entire design or sections  
**Result**: List of colors not linked to styles

### 🛡️ QA & Lint (Lead)
**What**: Quality audit with health score  
**When**: Before dev handoff  
**Select**: Complete screens  
**Result**: Health score + error list

### 🚀 Handoff (Manager)
**What**: Add status pills  
**When**: Throughout design process  
**Select**: Frames/artboards  
**Result**: Visual status indicator added

---

## 🎨 Naming Conventions

### PascalCase (Default)
- `ButtonPrimary`
- `CardItem`
- `IconStar`
- `TextContainer`

### kebab-case
- `button-primary`
- `card-item`
- `icon-star`
- `text-container`

---

## 🎯 Atomic Design Levels

### Atom
- Text nodes → Content name
- Icons/Vectors → `Icon-[Shape]`

### Molecule
- Mixed children → `[Text]-Item`

### Organism
- Repeating children → `[Pattern]-Container`

---

## 🚦 Status Pill Colors

| Status | Color | Use Case |
|--------|-------|----------|
| 🔴 Draft | Red | Work in progress |
| 🟡 In Review | Orange | Ready for feedback |
| 🟢 Ready for Dev | Green | Approved for development |

---

## 🛡️ Quality Checks

### Missing Alt Text
- Images without descriptions
- Accessibility issue

### Default Names
- "Frame 1", "Group 2", etc.
- Poor organization

### Poor Contrast
- Very light text colors
- Potential readability issue

---

## 🎯 Health Score Guide

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Excellent | Ready to ship |
| 50-79 | Good | Minor fixes needed |
| 0-49 | Needs Work | Review errors |

---

## 💡 Pro Tips

### Module 1 (Clean)
- Run on entire frames for bulk operations
- Use PascalCase for component libraries
- Text layers auto-rename to content

### Module 2 (Tokens)
- Run regularly to catch drift
- Link colors to styles immediately
- Use Variables for dynamic themes

### Module 3 (QA & Lint)
- Run before every handoff
- Fix alt text first (accessibility)
- Rename default layers for clarity

### Module 4 (Handoff)
- Update status as work progresses
- Use Draft for WIP designs
- Ready for Dev = approved only

---

## ⌨️ Keyboard Shortcuts

*Plugin must be open*

- **Tab**: Switch between modules (not implemented yet)
- **Enter**: Run current module action (not implemented yet)
- **Esc**: Close plugin

---

## 🐛 Troubleshooting

### "No layers selected"
→ Select at least one layer in Figma

### "No renameable layers found"
→ You selected only components/instances (protected)

### "No detached colors found"
→ Great! Your design system is clean

### Status pill not appearing
→ Select a Frame, not individual layers

---

## 📊 Best Practices

### Daily Workflow
1. Design → Run **Clean** module
2. Before review → Run **QA & Lint**
3. Update → Run **Handoff** status

### Weekly Maintenance
1. Run **Tokens** on entire file
2. Link detached colors to styles
3. Review health scores across screens

### Before Handoff
1. Run **QA & Lint** (aim for 80+)
2. Fix all errors
3. Set **Handoff** status to 🟢 Ready

---

## 🎓 Career Progression

### Junior → Senior
Master **Clean** → Learn **Tokens**  
Focus: Speed → System Thinking

### Senior → Lead
Master **Tokens** → Learn **QA & Lint**  
Focus: Systems → Quality Control

### Lead → Manager
Master **QA & Lint** → Learn **Handoff**  
Focus: Quality → Process & Scale

---

## 📞 Need Help?

- Check the full README.md
- Review walkthrough.md
- Open GitHub Issues
- Email: support@layermate.com

---

**Quick Tip**: Start with Module 1 (Clean) to learn the basics, then progress through the modules as you grow in your career!
