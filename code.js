// ========================================
// LAYER MATE: CAREER OS - BACKEND LOGIC
// ========================================
// Purpose: A unified Design Ops tool that guides designers through 4 stages
// of career maturity via 4 distinct functional modules
// Architecture: Modular functions with separation of concerns
// ========================================

// ========================================
// PLUGIN INITIALIZATION
// Why: Sets up the UI with proper dimensions and theme support
// ========================================
figma.showUI(__html__, {
  width: 480,
  height: 720,
  themeColors: true
});

// ========================================
// UNDO/REDO MANAGER
// ========================================
class UndoManager {
  constructor(maxHistory = 20) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
  }

  captureState(actionType, nodes) {
    const state = {
      type: actionType,
      timestamp: Date.now(),
      changes: nodes.map(node => ({
        id: node.id,
        oldName: node.name,
        newName: null
      }))
    };

    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(state);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    return state;
  }

  updateState(state, nodes) {
    state.changes.forEach((change, i) => {
      if (nodes[i]) {
        change.newName = nodes[i].name;
      }
    });
  }

  undo() {
    if (!this.canUndo()) return null;
    const state = this.history[this.currentIndex];
    this.currentIndex--;
    return state;
  }

  redo() {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  getHistory() {
    return this.history.slice(0, this.currentIndex + 1);
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

const undoManager = new UndoManager(20);

// Undo/Redo handlers are defined near the bottom of this file.

// ========================================
// SETTINGS MANAGEMENT
// ========================================
const DEFAULT_SETTINGS = {
  achievements: {
    enabled: true,
    thresholds: { first: 1, novice: 10, expert: 50, master: 100 }
  },
  naming: {
    defaultCasing: 'pascal',
    defaultConvention: 'atomic'
  },
  modules: {
    showAdvancedOptions: false,
    rememberTab: true
  }
};

async function loadSettings() {
  const saved = await figma.clientStorage.getAsync('userSettings');
  if (saved) {
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings) {
  await figma.clientStorage.setAsync('userSettings', settings);
  figma.ui.postMessage({ type: 'settings-saved', settings: settings });
  figma.notify('Settings saved successfully');
}

async function resetSettings() {
  await figma.clientStorage.setAsync('userSettings', DEFAULT_SETTINGS);
  figma.ui.postMessage({ type: 'settings-reset', settings: DEFAULT_SETTINGS });
  figma.notify('Settings reset to defaults');
}



// ========================================
// ADVANCED RENAMING HELPER FUNCTIONS
// ========================================

// Sequential Numbering
function addSequentialNumber(name, index, options) {
  var num = options.start + index;
  var padded = num.toString();

  // Add padding if specified
  if (options.padding > 0) {
    while (padded.length < options.padding) {
      padded = '0' + padded;
    }
  }

  if (options.position === 'prefix') {
    return padded + '-' + name;
  } else {
    return name + '-' + padded;
  }
}

// Find & Replace
function findAndReplaceInName(name, find, replace, caseSensitive) {
  if (!find) return name;

  if (caseSensitive) {
    return name.split(find).join(replace);
  } else {
    var regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return name.replace(regex, replace);
  }
}

// Prefix/Suffix
function addPrefixSuffix(name, prefix, suffix) {
  var result = name;
  if (prefix) result = prefix + result;
  if (suffix) result = result + suffix;
  return result;
}

// Naming Presets
function applyPreset(name, preset) {
  switch (preset) {
    case 'clean-defaults':
      // Remove default Figma names
      if (/^(Frame|Group|Rectangle|Ellipse|Vector|Component|Instance)\s*\d*$/i.test(name)) {
        return '';
      }
      return name;

    case 'remove-numbers':
      return name.replace(/\d+/g, '').replace(/\s+/g, ' ').replace(/[-_]+/g, '-').trim();

    case 'capitalize':
      return name.split(/[\s-_]/).map(function (word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');

    case 'lowercase':
      return name.toLowerCase();

    case 'uppercase':
      return name.toUpperCase();

    default:
      return name;
  }
}

// Generate name with advanced options (batch operations)
async function generateNameWithOptions(node, options, index) {
  var name = node.name;

  // Step 1: Apply preset first (if specified)
  if (options.preset) {
    name = applyPreset(name, options.preset);
    if (!name) name = 'layer'; // Fallback if preset clears name
  }

  // Step 2: Apply base renaming using existing logic (if convention/casing specified)
  // For now, skip base renaming and just use current name
  // This can be enhanced later to integrate with handleAutoRename logic

  // Step 3: Apply find & replace
  if (options.findReplace && options.findReplace.enabled && options.findReplace.find) {
    name = findAndReplaceInName(
      name,
      options.findReplace.find,
      options.findReplace.replace || '',
      options.findReplace.caseSensitive || false
    );
  }

  // Step 4: Apply prefix/suffix
  if (options.prefixSuffix && options.prefixSuffix.enabled) {
    name = addPrefixSuffix(
      name,
      options.prefixSuffix.prefix || '',
      options.prefixSuffix.suffix || ''
    );
  }

  // Step 5: Apply sequential numbering (last, so numbers are at end/start)
  if (options.sequential && options.sequential.enabled) {
    name = addSequentialNumber(name, index, options.sequential);
  }

  return name;
}

// Helper to collect renameable nodes (used by generateRenamePreview)
function collectRenameableNodesSimple(node, result) {
  // Skip locked nodes
  if (node.locked) return;

  // Add current node if it's renameable
  if ('name' in node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
    result.push(node);
  }

  // Recursively collect from children
  if ('children' in node) {
    for (var i = 0; i < node.children.length; i++) {
      collectRenameableNodesSimple(node.children[i], result);
    }
  }
}

// Generate convention-aware preview of rename changes
async function generateRenamePreview(convention, casing, filters, prefs) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return { error: 'No layers selected', previews: [] };
  }

  // Use same collection logic as handleAutoRename (respects filters)
  const nodesToRename = [];
  for (const node of selection) {
    collectRenameableNodes(node, nodesToRename, filters || {});
  }

  if (nodesToRename.length === 0) {
    return { error: 'No renameable layers found', previews: [] };
  }

  const previews = [];
  for (const node of nodesToRename) {
    try {
      const oldName = node.name;
      let newName;

      // Use architect-mode rename for handoff convention
      if (convention === 'handoff') {
        // For preview, just use generateName with handoff convention
        newName = await generateName(node, casing || 'kebab', convention, prefs || {});
      } else {
        newName = await generateName(node, casing || 'kebab', convention || 'atomic', prefs || {});
      }

      if (newName && newName !== oldName) {
        previews.push({ nodeId: node.id, oldName, newName });
      }
    } catch (e) {
      // skip node on error
    }
  }

  return { previews, total: nodesToRename.length };
}

// ========================================
// MESSAGE HANDLER - Central Communication Hub
// Why: Routes all UI-to-backend messages to appropriate module handlers
// ========================================
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      // MODULE 1: THE CLEANER (Junior Level)
      case 'auto-rename':
        // Check if Handoff Mode is selected
        if (msg.convention === 'handoff') {
          await handleArchitectModeRename(msg.casing, msg.filters);
        } else {
          await handleAutoRename(msg.casing, msg.convention, msg.filters, msg.prefs);
        }
        break;

      // MODULE 2: THE ORGANIZER (Senior Level)
      case 'smart-grouping':
        await handleSmartGrouping();
        break;

      case 'find-detached-colors':
        await handleFindDetachedColors();
        break;

      // Settings handlers
      case 'load-settings':
        const loadedSettings = await loadSettings();
        figma.ui.postMessage({ type: 'settings-loaded', settings: loadedSettings });
        break;

      case 'save-settings':
        await saveSettings(msg.settings);
        break;

      case 'reset-settings':
        await resetSettings();
        break;

      // Undo/Redo handlers
      case 'undo':
        await handleUndo();
        break;

      case 'redo':
        await handleRedo();
        break;

      case 'auto-fix-color':
        await handleAutoFixColor(msg.nodeId, msg.issueIndex, msg.styleName);
        break;

      // Advanced Renaming Features
      case 'preview-rename':
        var previewResult = await generateRenamePreview(
          msg.convention,
          msg.casing,
          msg.filters,
          msg.prefs
        );
        figma.ui.postMessage({
          type: 'rename-preview',
          previews: previewResult.previews,
          total: previewResult.total,
          error: previewResult.error
        });
        break;

      case 'apply-preview':
        // Capture state for undo
        var nodesToChange = [];
        for (var i = 0; i < msg.changes.length; i++) {
          var node = figma.getNodeById(msg.changes[i].nodeId);
          if (node) nodesToChange.push(node);
        }
        var state = undoManager.captureState('rename', nodesToChange);

        // Apply changes
        var appliedCount = 0;
        for (var i = 0; i < msg.changes.length; i++) {
          var change = msg.changes[i];
          var node = figma.getNodeById(change.nodeId);
          if (node && 'name' in node) {
            node.name = change.newName;
            appliedCount++;
          }
        }

        // Update undo state
        undoManager.updateState(state, nodesToChange);

        figma.ui.postMessage({
          type: 'auto-rename-complete',
          count: appliedCount,
          canUndo: undoManager.canUndo(),
          canRedo: undoManager.canRedo()
        });
        figma.notify('Renamed ' + appliedCount + ' layers');
        await trackAction('advanced-rename', { count: appliedCount });
        break;

      case 'apply-preset':
        var selection = figma.currentPage.selection;
        if (selection.length === 0) {
          figma.notify('Please select at least one layer');
          break;
        }

        var nodesToRename = [];
        for (var i = 0; i < selection.length; i++) {
          collectRenameableNodes(selection[i], nodesToRename, {});
        }

        if (nodesToRename.length === 0) {
          figma.notify('No renameable layers found');
          break;
        }

        // Capture state for undo
        var state = undoManager.captureState('preset-rename', nodesToRename);

        var renamedCount = 0;
        for (var i = 0; i < nodesToRename.length; i++) {
          var node = nodesToRename[i];
          var newName = applyPreset(node.name, msg.preset);
          if (newName && newName !== node.name) {
            node.name = newName;
            renamedCount++;
          }
        }

        // Update undo state
        undoManager.updateState(state, nodesToRename);

        figma.ui.postMessage({
          type: 'preset-complete',
          count: renamedCount,
          canUndo: undoManager.canUndo(),
          canRedo: undoManager.canRedo()
        });
        figma.notify('Applied preset to ' + renamedCount + ' layers');
        await trackAction('preset-rename', { preset: msg.preset, count: renamedCount });
        break;

      // Dynamic window resize
      case 'resize-window':
        figma.ui.resize(480, Math.min(msg.height, 800)); // Cap at 800px max
        break;

      // MODULE: INSPECT — Frame Stats Scanner
      case 'scan-frame':
        await handleScanFrame();
        break;

      case 'select-by-type':
        await handleSelectByType(msg.scanType, msg.prefs);
        break;

      // MODULE 3: THE LINTER (Lead Level)
      case 'quality-audit':
        await handleQualityAudit(msg.prefs);
        break;


      // MODULE 4: THE HANDOFF MANAGER (Manager Level)
      case 'set-frame-status':
        await handleSetFrameStatus(msg.status);
        break;

      // LOCATE NODE (for error navigation)
      case 'locate-node':
        await handleLocateNode(msg.nodeId);
        break;

      // CHECK DESTRUCTIVE ACTIONS (Pre-flight counts)
      case 'check-hidden-layers':
        await handleCheckHiddenLayers(msg.prefs);
        break;
      case 'check-redundant-wrappers':
        await handleCheckRedundantWrappers(msg.prefs);
        break;
      case 'check-empty-frames':
        await handleCheckEmptyFrames(msg.prefs);
        break;

      // REMOVE HIDDEN LAYERS
      case 'remove-hidden-layers':
        await handleRemoveHiddenLayers();
        break;
      case 'remove-redundant-wrappers':
        await handleRemoveRedundantWrappers();
        break;

      case 'unlock-all-layers':
        await handleUnlockAllLayers(msg.prefs);
        break;

      case 'remove-empty-frames':
        await handleRemoveEmptyFrames();
        break;

      // STATE PERSISTENCE
      case 'save-tab':
        await figma.clientStorage.setAsync('lastActiveTab', msg.tab);
        break;

      case 'load-preferences':
        await loadPreferences();
        break;


      default:
        console.warn('Unknown message type:', msg.type);
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error.message || 'An unexpected error occurred'
    });
  }
};

// ========================================
// MODULE 1: THE CLEANER (JUNIOR LEVEL)
// Career Stage: Junior Designer
// Focus: Speed & Efficiency
// Why: Juniors need to work fast and learn naming conventions.
// This automates the tedious task of renaming layers, teaching
// multiple naming patterns: Atomic Design, Slash Structure, BEM, Component Library.
// ========================================
async function handleAutoRename(casing = 'pascal', convention = 'atomic', filters = {}, prefs = {}) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one layer'
    });
    return;
  }

  // Collect all renameable nodes recursively
  const nodesToRename = [];
  for (const node of selection) {
    collectRenameableNodes(node, nodesToRename, filters);
  }

  if (nodesToRename.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No renameable layers found (check your filters)'
    });
    return;
  }

  let renamedCount = 0;
  const stats = { text: 0, shape: 0, img: 0, item: 0, container: 0, section: 0, block: 0 };

  try {
    // CAPTURE STATE BEFORE RENAMING (for undo)
    const state = undoManager.captureState('rename', nodesToRename);

    for (const node of nodesToRename) {
      try {
        const newName = await generateName(node, casing, convention, prefs);
        if (newName && newName !== node.name) {
          node.name = newName;
          renamedCount++;
          // Track stats
          const nameLower = newName.toLowerCase();
          if (nameLower.includes('text')) stats.text++;
          else if (nameLower.includes('shape')) stats.shape++;
          else if (nameLower.includes('img')) stats.img++;
          else if (nameLower.includes('item')) stats.item++;
          else if (nameLower.includes('container')) stats.container++;
          else if (nameLower.includes('section')) stats.section++;
          else if (nameLower.includes('block')) stats.block++;
        }
      } catch (nodeErr) {
        // Skip this node if something goes wrong, continue with others
        console.error('Error renaming node:', node.name, nodeErr);
      }
    }

    // UPDATE STATE AFTER RENAMING (for undo)
    undoManager.updateState(state, nodesToRename);
  } finally {
    // ALWAYS send completion — spinner must never be left stuck
    figma.ui.postMessage({
      type: 'auto-rename-complete',
      count: renamedCount,
      stats: stats,
      canUndo: undoManager.canUndo(),
      canRedo: undoManager.canRedo()
    });

    if (renamedCount > 0) {
      figma.notify(`✅ Renamed ${renamedCount} layer${renamedCount !== 1 ? 's' : ''}`);
    } else {
      figma.notify('No layers renamed (already named correctly or filtered out)');
    }
  }
}

// ========================================
// HELPER: COLLECT RENAMEABLE NODES WITH FILTERS
// ========================================
function collectRenameableNodes(node, collection, filters = {}) {
  // Always skip components, component sets, and instances — never rename or traverse into them
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE') {
    return;
  }

  // Apply smart filters
  if (shouldSkipNode(node, filters)) {
    return;
  }

  // Add node to collection
  collection.push(node);

  // Recursively collect children (instances already returned above, so this is safe)
  if ('children' in node) {
    for (const child of node.children) {
      collectRenameableNodes(child, collection, filters);
    }
  }
}

// ========================================
// HELPER: SHOULD SKIP NODE (SMART FILTERS)
// ========================================
function shouldSkipNode(node, filters) {
  // Filter: Skip locked layers
  if (filters.skipLocked && node.locked) {
    return true;
  }

  // Filter: Skip hidden layers
  if (filters.skipHidden && !node.visible) {
    return true;
  }

  // Filter: Only rename default names
  if (filters.onlyDefaultNames && !isDefaultName(node.name)) {
    return true;
  }

  return false;
}

// ========================================
// HELPER: RESOLVE TEXT STYLE (Local or Remote)
// Uses a timeout to prevent importStyleByKeyAsync from hanging
// ========================================
async function resolveTextStyle(textStyleId) {
  // 1. Try local style first (synchronous, instant)
  try {
    const local = figma.getStyleById(textStyleId);
    if (local && local.name) return local;
  } catch (e) { }

  // 2. Try remote/library style import with a 3-second timeout
  try {
    const matches = textStyleId.match(/^S:([^,]+)/);
    if (!matches || !matches[1]) return null;

    const importPromise = figma.importStyleByKeyAsync(matches[1]);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 3000));
    const style = await Promise.race([importPromise, timeoutPromise]);
    if (style && style.name) return style;
  } catch (e) { }

  return null;
}

// ========================================
// HELPER: CHECK IF DEFAULT NAME
// ========================================
function isDefaultName(name) {
  // Match patterns like: Frame 1, Rectangle 2, Group 3, etc.
  const defaultPatterns = [
    /^Frame \d+$/,
    /^Rectangle \d+$/,
    /^Group \d+$/,
    /^Ellipse \d+$/,
    /^Vector \d+$/,
    /^Line \d+$/,
    /^Star \d+$/,
    /^Polygon \d+$/,
    /^Text \d+$/,
    /^Component \d+$/,
    /^Instance \d+$/
  ];

  return defaultPatterns.some(pattern => pattern.test(name));
}

// ========================================
// MODULE 2: THE ORGANIZER (SENIOR LEVEL)
// Career Stage: Senior Designer
// Focus: System Thinking & Organization
// Why: Seniors organize component libraries using slash notation.
// This automates the grouping of related components:
// Button Primary, Button Secondary → Button / Primary, Button / Secondary
// ========================================
async function handleSmartGrouping() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one layer'
    });
    return;
  }

  // Detect common prefixes and group items
  const groups = detectPrefixGroups(selection);

  if (Object.keys(groups).length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No groupable items found. Layers need common prefixes (e.g., Button Primary, Button Secondary)'
    });
    return;
  }

  let renamedCount = 0;
  const groupNames = [];

  for (const [prefix, items] of Object.entries(groups)) {
    groupNames.push(prefix);
    for (const item of items) {
      // Extract suffix after prefix
      const suffix = extractSuffix(item.name, prefix);
      if (suffix) {
        item.name = `${prefix} / ${suffix}`;
        renamedCount++;
      }
    }
  }

  figma.ui.postMessage({
    type: 'grouping-complete',
    count: renamedCount,
    groups: groupNames
  });
}

// ========================================
// HELPER: DETECT PREFIX GROUPS
// Finds layers with common prefixes
// ========================================
function detectPrefixGroups(nodes) {
  const groups = {};

  for (const node of nodes) {
    const prefix = extractPrefix(node.name);
    if (prefix) {
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(node);
    }
  }

  // Only return groups with 2+ items
  return Object.fromEntries(
    Object.entries(groups).filter(([_, items]) => items.length >= 2)
  );
}

// ========================================
// HELPER: EXTRACT PREFIX
// Examples:
// "ButtonPrimary" → "Button"
// "Button Primary" → "Button"
// "CardProduct" → "Card"
// ========================================
function extractPrefix(name) {
  // Remove existing slashes
  name = name.replace(/\s*\/\s*/g, '');

  // Try to split on capital letters (PascalCase)
  const pascalMatch = name.match(/^([A-Z][a-z]+)([A-Z])/);
  if (pascalMatch) {
    return pascalMatch[1];
  }

  // Try to split on spaces
  const spaceMatch = name.match(/^([A-Za-z]+)\s+/);
  if (spaceMatch) {
    return spaceMatch[1];
  }

  // Try to split on hyphens or underscores
  const separatorMatch = name.match(/^([A-Za-z]+)[-_]/);
  if (separatorMatch) {
    return separatorMatch[1];
  }

  return null;
}

// ========================================
// HELPER: EXTRACT SUFFIX
// Removes prefix from name to get the variant
// ========================================
function extractSuffix(name, prefix) {
  // Remove existing slashes
  name = name.replace(/\s*\/\s*/g, '');

  // Remove prefix and clean up
  let suffix = name.replace(new RegExp(`^${prefix}`, 'i'), '').trim();

  // Remove leading separators
  suffix = suffix.replace(/^[-_\s]+/, '');

  // Capitalize first letter if needed
  if (suffix && suffix.length > 0) {
    suffix = suffix.charAt(0).toUpperCase() + suffix.slice(1);
  }

  return suffix;
}

// ========================================
// MODULE 2: DETACHED COLORS (Secondary Feature)
// Career Stage: Senior Designer
// Focus: System Thinking
// Why: Seniors enforce design systems. Detached colors create
// technical debt and inconsistency. This module helps identify
// raw HEX codes that should be linked to design tokens/variables.
// ========================================
async function handleFindDetachedColors() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one layer'
    });
    return;
  }

  // Get all local color sources (Variables + Paint Styles) for suggestions
  const colorSources = [];

  try {
    // 1. Fetch Local Variables
    const localVariables = await figma.variables.getLocalVariablesAsync();
    const colorVariables = localVariables.filter(v => v.resolvedType === 'COLOR');

    // Resolve aliases and normalize
    for (const variable of colorVariables) {
      const valuesByMode = variable.valuesByMode;
      const modeId = Object.keys(valuesByMode)[0]; // Use first mode
      if (!modeId) continue;

      let colorValue = valuesByMode[modeId];

      // Handle Alias (try to resolve one level)
      if (colorValue && typeof colorValue === 'object' && colorValue.type === 'VARIABLE_ALIAS') {
        try {
          const resolvedVar = await figma.variables.getVariableByIdAsync(colorValue.id);
          if (resolvedVar && resolvedVar.resolvedType === 'COLOR') {
            const resolvedModeId = Object.keys(resolvedVar.valuesByMode)[0];
            if (resolvedModeId) {
              colorValue = resolvedVar.valuesByMode[resolvedModeId];
            }
          }
        } catch (e) {
          // Ignore resolution errors
        }
      }

      if (colorValue && typeof colorValue === 'object' && 'r' in colorValue) {
        colorSources.push({
          name: variable.name,
          color: colorValue, // {r, g, b, a?}
          type: 'VARIABLE'
        });
      }
    }

    // 2. Fetch Local Paint Styles
    const localStyles = await figma.getLocalPaintStylesAsync();
    for (const style of localStyles) {
      const paint = style.paints[0];
      if (paint && paint.type === 'SOLID' && paint.visible !== false) {
        colorSources.push({
          name: style.name,
          color: paint.color, // {r, g, b}
          type: 'STYLE'
        });
      }
    }

  } catch (error) {
    console.error('Error fetching color sources:', error);
  }

  // ========================================
  // DELTA E COLOR MATCHING
  // ========================================

  // Convert RGB to LAB color space
  function rgbToLab(r, g, b) {
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
    let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
    let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

    x = x / 95.047;
    y = y / 100.000;
    z = z / 108.883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

    return { L: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) };
  }

  // Calculate Delta E distance
  function calculateDeltaE(c1, c2) {
    const lab1 = rgbToLab(c1.r, c1.g, c1.b);
    const lab2 = rgbToLab(c2.r, c2.g, c2.b);
    const dL = lab1.L - lab2.L, dA = lab1.a - lab2.a, dB = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + dA * dA + dB * dB);
  }

  // Calculate confidence (0-100%)
  function calculateConfidence(deltaE) {
    if (deltaE < 2) return 100;
    if (deltaE < 10) return Math.round(100 - ((deltaE - 2) / 8) * 30);
    if (deltaE < 50) return Math.round(70 - ((deltaE - 10) / 40) * 40);
    return Math.max(0, Math.round(30 - ((deltaE - 50) / 50) * 30));
  }

  // Find closest color with Delta E
  function findClosestColorVariable(targetColor, colorSources) {
    if (!colorSources || colorSources.length === 0) return null;

    let bestMatch = null;
    let lowestDeltaE = Infinity;

    for (const source of colorSources) {
      const deltaE = calculateDeltaE(targetColor, source.color);
      if (deltaE < lowestDeltaE) {
        lowestDeltaE = deltaE;
        bestMatch = {
          name: source.name,
          type: source.type,
          color: source.color,
          deltaE: Math.round(deltaE * 10) / 10,
          confidence: calculateConfidence(deltaE)
        };
      }
    }

    return bestMatch;
  }

  // Collect all nodes with detached colors
  const detachedColors = [];
  const allNodes = [];

  for (const node of selection) {
    collectAllNodes(node, allNodes);
  }

  // Check each node for detached colors (skip components)
  for (const node of allNodes) {
    // Skip if it's a component, instance, or component set
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
      continue;
    }

    // Skip if ANY parent in the hierarchy is a component (nested components)
    let currentNode = node.parent;
    let isInsideComponent = false;
    while (currentNode) {
      if (currentNode.type === 'COMPONENT' || currentNode.type === 'INSTANCE' || currentNode.type === 'COMPONENT_SET') {
        isInsideComponent = true;
        break;
      }
      currentNode = currentNode.parent;
    }
    if (isInsideComponent) {
      continue;
    }


    // Check Typography & Auto-Rename
    // Rule: If text has a style, rename layer to match style name
    let displayName = node.name;
    if (node.type === 'TEXT' && node.textStyleId && node.textStyleId !== figma.mixed) {
      try {
        const style = figma.getStyleById(node.textStyleId);
        if (style) {
          displayName = style.name;
          // Only rename if it's different to avoid unnecessary writes
          if (node.name !== style.name) {
            node.name = style.name;
          }
        }
      } catch (e) {
        // Ignore error
      }
    }

    const issues = checkForDetachedColors(node);
    if (issues.length > 0) {
      // Find suggested variables for each detached color (skip for typography)
      const issuesWithSuggestions = issues.map(issue => {
        let suggestion = null;
        if (issue.type !== 'typography') {
          suggestion = findClosestColorVariable(issue.color, colorSources);
        }

        const newIssue = Object.assign({}, issue);
        newIssue.suggestion = suggestion;
        return newIssue;
      });


      detachedColors.push({
        id: node.id,
        name: displayName,
        type: node.type,
        issues: issuesWithSuggestions
      });
    }
  }

  figma.ui.postMessage({
    type: 'detached-colors-found',
    data: detachedColors
  });
}

// ========================================
// AUTO-FIX COLOR
// Applies suggested color style/variable to a detached color
// ========================================
async function handleAutoFixColor(nodeId, issueIndex, styleName) {
  try {
    const node = figma.getNodeById(nodeId);
    if (!node) {
      figma.notify('❌ Node not found');
      return;
    }

    // Find the color style or variable by name
    let colorToApply = null;
    let styleType = null;

    // Try to find as paint style first
    const localStyles = await figma.getLocalPaintStylesAsync();
    const matchingStyle = localStyles.find(s => s.name === styleName);

    if (matchingStyle) {
      colorToApply = matchingStyle.id;
      styleType = 'STYLE';
    } else {
      // Try to find as variable
      const localVariables = await figma.variables.getLocalVariablesAsync();
      const matchingVariable = localVariables.find(v => v.name === styleName);

      if (matchingVariable) {
        colorToApply = matchingVariable.id;
        styleType = 'VARIABLE';
      }
    }

    if (!colorToApply) {
      figma.notify(`❌ Style "${styleName}" not found`);
      return;
    }

    // Apply the color based on the issue type
    let applied = false;

    if ('fills' in node && issueIndex !== undefined) {
      const fills = Array.isArray(node.fills) ? [...node.fills] : [];
      if (fills[issueIndex]) {
        if (styleType === 'STYLE') {
          node.fillStyleId = colorToApply;
        } else {
          fills[issueIndex] = Object.assign({}, fills[issueIndex], {
            boundVariables: { color: { type: 'VARIABLE_ALIAS', id: colorToApply } }
          });
          node.fills = fills;
        }
        applied = true;
      }
    }

    if ('strokes' in node && issueIndex !== undefined) {
      const strokes = Array.isArray(node.strokes) ? [...node.strokes] : [];
      if (strokes[issueIndex]) {
        if (styleType === 'STYLE') {
          node.strokeStyleId = colorToApply;
        } else {
          strokes[issueIndex] = Object.assign({}, strokes[issueIndex], {
            boundVariables: { color: { type: 'VARIABLE_ALIAS', id: colorToApply } }
          });
          node.strokes = strokes;
        }
        applied = true;
      }
    }

    if (applied) {
      figma.notify(`✅ Applied "${styleName}" to ${node.name}`);
      figma.ui.postMessage({
        type: 'color-fixed',
        nodeId: nodeId,
        issueIndex: issueIndex
      });
    } else {
      figma.notify('❌ Could not apply color');
    }

  } catch (error) {
    console.error('Auto-fix error:', error);
    figma.notify(`❌ Error: ${error.message}`);
  }
}

// ========================================
// UTILITY: REMOVE HIDDEN LAYERS
// Removes all hidden layers while protecting components
// ========================================
async function handleCheckHiddenLayers(prefs) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Please select at least one layer or frame' });
    return;
  }

  const matchedNodes = [];
  let lockedCount = 0;
  function collectHiddenLayers(node) {
    // Check if the node is inside a component/instance hierarchy
    let currentNode = node.parent;
    let isInsideComponent = false;
    while (currentNode) {
      if (currentNode.type === 'COMPONENT' || currentNode.type === 'INSTANCE' || currentNode.type === 'COMPONENT_SET') {
        isInsideComponent = true;
        break;
      }
      currentNode = currentNode.parent;
    }

    // If it is NOT inside a component, check if it's hidden
    if (!isInsideComponent && node.visible === false) {
      if (node.locked) {
        lockedCount++;
      } else {
        matchedNodes.push(node);
      }
    }

    // Recurse into children ONLY if node itself is not a component/instance
    if ('children' in node) {
      if (node.type !== 'COMPONENT' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT_SET') {
        for (const child of node.children) {
          collectHiddenLayers(child);
        }
      }
    }
  }

  for (const node of selection) {
    collectHiddenLayers(node);
  }

  if (matchedNodes.length > 0) {
    figma.currentPage.selection = matchedNodes;
    if (prefs && prefs.autoZoom) figma.viewport.scrollAndZoomIntoView(matchedNodes);
  }

  figma.ui.postMessage({
    type: 'check-result',
    action: 'remove-hidden-layers',
    count: matchedNodes.length,
    lockedCount: lockedCount
  });
}

async function handleRemoveHiddenLayers() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one layer or frame'
    });
    return;
  }

  // Collect all hidden layers (excluding components)
  const hiddenLayers = [];
  let lockedCount = 0;

  function collectHiddenLayers(node) {
    // Check if the node is inside a component/instance hierarchy
    let currentNode = node.parent;
    let isInsideComponent = false;
    while (currentNode) {
      if (currentNode.type === 'COMPONENT' || currentNode.type === 'INSTANCE' || currentNode.type === 'COMPONENT_SET') {
        isInsideComponent = true;
        break;
      }
      currentNode = currentNode.parent;
    }

    // If it is NOT inside a component, check if it's hidden
    if (!isInsideComponent && node.visible === false) {
      if (node.locked) {
        lockedCount++;
      } else {
        hiddenLayers.push(node);
      }
    }

    // Recurse into children ONLY if node itself is not a component/instance
    if ('children' in node) {
      if (node.type !== 'COMPONENT' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT_SET') {
        for (const child of node.children) {
          collectHiddenLayers(child);
        }
      }
    }
  }

  // Collect hidden layers from selection
  for (const node of selection) {
    collectHiddenLayers(node);
  }

  // Remove hidden layers
  let removedCount = 0;
  for (const layer of hiddenLayers) {
    try {
      layer.remove();
      removedCount++;
    } catch (error) {
      // Skip if layer can't be removed
    }
  }

  figma.ui.postMessage({
    type: 'hidden-layers-removed',
    count: removedCount,
    lockedCount: lockedCount
  });
}

// ========================================
// UTILITY: REMOVE REDUNDANT WRAPPERS
// Un-groups frames/groups that contain only a single Text or Component
// ========================================
async function handleCheckRedundantWrappers(prefs) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Select frames to clean' });
    return;
  }

  const matchedNodes = [];
  function scanAndCount(node) {
    if (node.locked) return;

    if ('children' in node) {
      const children = [...node.children];
      for (const child of children) {
        scanAndCount(child);
      }
    }

    const isContainer = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') return;

    if (isContainer && 'children' in node && node.children.length === 1) {
      if (!node.parent) return;
      matchedNodes.push(node);
    }
  }

  for (const node of selection) scanAndCount(node);

  if (matchedNodes.length > 0) {
    figma.currentPage.selection = matchedNodes;
    if (prefs && prefs.autoZoom) figma.viewport.scrollAndZoomIntoView(matchedNodes);
  }

  figma.ui.postMessage({
    type: 'check-result',
    action: 'remove-redundant-wrappers',
    count: matchedNodes.length
  });
}

async function handleRemoveRedundantWrappers() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Select frames to clean' });
    return;
  }

  let count = 0;

  // Recursive function to scan and clean (Bottom-Up)
  function scanAndClean(node) {
    // Skip if node is locked
    if (node.locked) {
      return;
    }

    // 1. Recurse first (Bottom-Up approach handles nesting)
    if ('children' in node) {
      // Create copy of children array to avoid modification issues during iteration
      const children = [...node.children];
      for (const child of children) {
        scanAndClean(child);
      }
    }

    // 2. Check if node is a candidate for UNGROUPING
    // Candidates: FRAME, GROUP, SECTION.
    const isContainer = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';

    // Constraint: Don't ungroup Components/Instances
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
      return;
    }

    // Constraint: Any single child (Text, Component, Shape, Image, etc.)
    // If a container has only 1 child, it's redundant - flatten it
    if (isContainer && 'children' in node && node.children.length === 1) {
      // Check if node has a parent (can't ungroup top-level nodes)
      if (!node.parent) {
        return;
      }

      try {
        // figma.ungroup(node) ungroups the node and promotes the child
        figma.ungroup(node);
        count++;
      } catch (e) { }
    }
  }

  // Iterate selection
  const nodes = [...selection];
  for (const node of nodes) {
    scanAndClean(node);
  }

  // Always send feedback
  if (count === 0) {
    figma.ui.postMessage({ type: 'error', message: 'No redundant wrappers found in selection' });
  } else {
    figma.ui.postMessage({ type: 'redundant-removed', count: count });
  }
}

// ========================================
// UTILITY: UNLOCK ALL LAYERS
// Recursively unlocks all layers in selection
// ========================================
async function handleUnlockAllLayers(prefs) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Select layers to unlock' });
    return;
  }

  const matchedNodes = [];
  function unlockRecursive(node) {
    // Skip if inside component instance logic prevents editing structure, 
    // but locking is a property we can usually toggle unless locked by parent instance?
    // Actually, we can unlock layers inside instances if it's an override.
    try {
      if (node.locked) {
        node.locked = false;
        matchedNodes.push(node);
      }
    } catch (e) { }

    if ('children' in node) {
      for (const child of node.children) {
        unlockRecursive(child);
      }
    }
  }

  for (const node of selection) {
    unlockRecursive(node);
  }

  if (matchedNodes.length > 0) {
    figma.currentPage.selection = matchedNodes;
    if (prefs && prefs.autoZoom) figma.viewport.scrollAndZoomIntoView(matchedNodes);
  }

  figma.ui.postMessage({ type: 'toast', message: `Unlocked ${matchedNodes.length} layer${matchedNodes.length !== 1 ? 's' : ''}` });
}

// ========================================
// UTILITY: REMOVE EMPTY FRAMES
// Recursively removes frames/groups with 0 children
// ========================================
async function handleCheckEmptyFrames(prefs) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Select scope for cleanup' });
    return;
  }

  const matchedNodes = [];
  function countEmptyRecursive(node) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') return;

    if ('children' in node) {
      for (const child of node.children) countEmptyRecursive(child);
    }

    const isContainer = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';
    if (isContainer && node.children && node.children.length === 0) {
      matchedNodes.push(node);
    }
  }

  for (const node of selection) countEmptyRecursive(node);

  if (matchedNodes.length > 0) {
    figma.currentPage.selection = matchedNodes;
    if (prefs && prefs.autoZoom) figma.viewport.scrollAndZoomIntoView(matchedNodes);
  }

  figma.ui.postMessage({
    type: 'check-result',
    action: 'remove-empty-frames',
    count: matchedNodes.length
  });
}

async function handleRemoveEmptyFrames() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Select scope for cleanup' });
    return;
  }

  let count = 0;

  // Bottom-up recursion to catch nested empty frames
  function removeEmptyRecursive(node) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') return;

    if ('children' in node) {
      const children = [...node.children];
      for (const child of children) {
        removeEmptyRecursive(child);
      }
    }

    // Check if empty container
    const isContainer = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';
    if (isContainer && node.children.length === 0) {
      // Don't remove if it has a fill? Maybe user wants empty colored boxes?
      // User requested "Empty Frames". Usually implies useless containers.
      // But let's be safe: if it has forced explicit "Empty" intent, we remove it.
      try {
        node.remove();
        count++;
      } catch (e) { }
    }
  }

  for (const node of selection) {
    removeEmptyRecursive(node);
  }

  if (count === 0) {
    figma.ui.postMessage({ type: 'toast', message: 'No empty frames found' });
  } else {
    figma.ui.postMessage({ type: 'toast', message: `Removed ${count} empty frames` });
  }
}

// ========================================
// MODULE 3: THE LINTER (LEAD LEVEL)
// Career Stage: Lead Designer
// Focus: Quality Control
// Why: Leads ensure quality across the team. This audit catches
// ========================================
// INSPECT — Frame Stats Scanner
// Scans the selected frame (or the current page) and returns
// counts for: total layers, hidden, locked, unnamed (default
// names like "Frame 1", "Group 2", "Rectangle 3"), empty
// frames/groups, and deeply nested layers (depth > 4).
// ========================================
async function handleScanFrame() {
  // Determine root: use the selection array if > 0, otherwise fallback to page
  const selection = figma.currentPage.selection;
  const roots = selection.length > 0 ? [...selection] : [figma.currentPage];

  // Store the roots so subsequent "select by type" requests scan the same area
  // even if the user's selection changes after clicking the first stat.
  lastScannedRoot = roots;

  const DEFAULT_NAME_RE = /^(Frame|Group|Rectangle|Ellipse|Line|Vector|Polygon|Star|Component|Image|Text|Section)\s+\d+$/i;

  let total = 0;
  let hidden = 0;
  let locked = 0;
  let unnamed = 0;
  let empty = 0;
  let deeplyNested = 0;

  function walk(node, depth, isRoot) {

    // Don't count the root itself — only its descendants (unless requested otherwise)
    if (!isRoot) {
      total++;
      if ('visible' in node && !node.visible) hidden++;
      if ('locked' in node && node.locked) locked++;
      if (DEFAULT_NAME_RE.test(node.name)) unnamed++;
      if (depth > 4) deeplyNested++;

      const hasChildren = 'children' in node && node.children.length === 0;
      const isContainer = node.type === 'FRAME' || node.type === 'GROUP';
      if (isContainer && hasChildren) empty++;
    }

    // Only traverse children if the node is not a component/instance
    if ('children' in node) {
      if (node.type !== 'COMPONENT' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT_SET') {
        for (const child of node.children) {
          walk(child, depth + 1, false);
        }
      }
    }
  }

  for (const rootNode of roots) {
    walk(rootNode, 0, true);
  }

  let rootName = "Multiple Selections";
  if (roots.length === 1) {
    rootName = roots[0].type === 'PAGE' ? figma.currentPage.name : roots[0].name;
  }

  figma.ui.postMessage({
    type: 'scan-frame-result',
    rootName,
    stats: { total, hidden, locked, unnamed, empty, deeplyNested }
  });
}

// ========================================
// SELECT SCANNED LAYERS BY TYPE
// ========================================
let lastScannedRoot = null; // Store the roots from the last scan

async function handleSelectByType(type, prefs) {
  // Ensure the roots haven't been deleted or invalidated by Figma.
  let roots = [];
  if (lastScannedRoot && Array.isArray(lastScannedRoot) && lastScannedRoot.every(r => !r.removed)) {
    roots = lastScannedRoot;
  } else {
    roots = figma.currentPage.selection.length > 0 ? [...figma.currentPage.selection] : [figma.currentPage];
  }

  const DEFAULT_NAME_RE = /^(Frame|Group|Rectangle|Ellipse|Line|Vector|Polygon|Star|Component|Image|Text|Section)\s+\d+$/i;
  const matchedNodes = [];

  function walk(node, depth, isRoot) {

    if (!isRoot) {
      let match = false;
      if (type === 'hidden' && 'visible' in node && !node.visible) match = true;
      if (type === 'locked' && 'locked' in node && node.locked) match = true;
      if (type === 'unnamed' && DEFAULT_NAME_RE.test(node.name)) match = true;
      if (type === 'deeplyNested' && depth > 4) match = true;

      const hasChildren = 'children' in node && node.children.length === 0;
      const isContainer = node.type === 'FRAME' || node.type === 'GROUP';
      if (type === 'empty' && isContainer && hasChildren) match = true;

      if (match) matchedNodes.push(node);
    }

    // Only traverse children if the node is not a component/instance
    if ('children' in node) {
      if (node.type !== 'COMPONENT' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT_SET') {
        for (const child of node.children) {
          walk(child, depth + 1, false);
        }
      }
    }
  }

  for (const rootNode of roots) {
    walk(rootNode, 0, true);
  }

  if (matchedNodes.length > 0) {
    figma.currentPage.selection = matchedNodes;
    if (prefs && prefs.autoZoom) figma.viewport.scrollAndZoomIntoView(matchedNodes);
    figma.ui.postMessage({ type: 'toast', message: `Selected ${matchedNodes.length} ${type} layer${matchedNodes.length !== 1 ? 's' : ''}` });
  } else {
    figma.ui.postMessage({ type: 'toast', message: `No ${type} layers found` });
  }
}

// ========================================
// QUALITY AUDIT (Lead Level)
// Scans the selection for the three most
async function handleQualityAudit(prefs) {

  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one layer'
    });
    return;
  }

  // Collect all nodes
  const allNodes = [];
  for (const node of selection) {
    collectAllNodes(node, allNodes);
  }

  // WCAG 2.1 Helper Functions
  const getRelativeLuminance = (r, g, b) => {
    const RsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const GsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const BsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return 0.2126 * RsRGB + 0.7152 * GsRGB + 0.0722 * BsRGB;
  };

  const getContrastRatio = (c1, c2) => {
    const L1 = getRelativeLuminance(c1.r, c1.g, c1.b);
    const L2 = getRelativeLuminance(c2.r, c2.g, c2.b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };

  const getWCAGCompliance = (ratio, fontSize, isBold) => {
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold);
    const passAA = isLarge ? ratio >= 3 : ratio >= 4.5;
    const passAAA = isLarge ? ratio >= 4.5 : ratio >= 7;
    return {
      ratio: Math.round(ratio * 100) / 100,
      isLarge,
      passAA,
      passAAA,
      level: passAAA ? 'AAA' : (passAA ? 'AA' : 'FAIL')
    };
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  };

  // Run quality checks
  const errors = {
    defaultNames: [],
    poorContrast: [],
    smallFonts: [],
    smallTouchTargets: [],
    detachedTextStyles: [],
    detachedColors: []
  };

  const detachedFontsMap = {};
  const detachedColorsMap = {};

  let totalChecks = 0;
  let passedChecks = 0;

  for (const node of allNodes) {
    // Check if user requested to ignore hidden layers in audit score
    if (prefs && prefs.ignoreHidden && 'visible' in node && !node.visible) {
      continue; // Skip hidden nodes in QA
    }

    // Completely skip components and instances from all audit checks
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
      continue;
    }

    // --- NEW: Detached Style Checks ---

    // Check Detached Fonts
    if (node.type === 'TEXT') {
      totalChecks++;

      const hasTypographyVariable = node.boundVariables && (
        node.boundVariables.fontFamily !== undefined ||
        node.boundVariables.fontSize !== undefined ||
        node.boundVariables.fontWeight !== undefined ||
        node.boundVariables.lineHeight !== undefined ||
        node.boundVariables.letterSpacing !== undefined
      );

      if (!hasTypographyVariable && (!node.textStyleId || node.textStyleId === '' || node.textStyleId === figma.mixed)) {
        let fontNameStr = 'Mixed or Unknown Font';
        if (node.fontName && typeof node.fontName !== 'symbol') {
          fontNameStr = `${node.fontName.family} ${node.fontName.style}`;
        }
        if (!detachedFontsMap[fontNameStr]) {
          detachedFontsMap[fontNameStr] = [];
        }
        detachedFontsMap[fontNameStr].push(node.id);
      } else {
        passedChecks++;
      }
    }

    // Check Detached Colors (Fills & Strokes)
    let hasDetachedColor = false;
    let nodeHexCodes = [];

    if ('fills' in node && Array.isArray(node.fills)) {
      node.fills.forEach(f => {
        const isColorBound = f.boundVariables && f.boundVariables.color !== undefined;
        if (f.type === 'SOLID' && f.visible !== false && !isColorBound && (!node.fillStyleId || node.fillStyleId === '' || node.fillStyleId === figma.mixed)) {
          hasDetachedColor = true;
          if (f.color) nodeHexCodes.push(rgbToHex(f.color.r, f.color.g, f.color.b));
        }
      });
    } else if (node.type === 'TEXT' && node.fills === figma.mixed) {
      const segments = node.getStyledTextSegments(['fills', 'fillStyleId']);
      segments.forEach(seg => {
        if (Array.isArray(seg.fills)) {
          seg.fills.forEach(f => {
            const isColorBound = f.boundVariables && f.boundVariables.color !== undefined;
            if (f.type === 'SOLID' && f.visible !== false && !isColorBound && (!seg.fillStyleId || seg.fillStyleId === '' || seg.fillStyleId === figma.mixed)) {
              hasDetachedColor = true;
              if (f.color) nodeHexCodes.push(rgbToHex(f.color.r, f.color.g, f.color.b));
            }
          });
        }
      });
    }
    if ('strokes' in node && Array.isArray(node.strokes)) {
      node.strokes.forEach(s => {
        const isColorBound = s.boundVariables && s.boundVariables.color !== undefined;
        if (s.type === 'SOLID' && s.visible !== false && !isColorBound && (!node.strokeStyleId || node.strokeStyleId === '' || node.strokeStyleId === figma.mixed)) {
          hasDetachedColor = true;
          if (s.color) nodeHexCodes.push(rgbToHex(s.color.r, s.color.g, s.color.b));
        }
      });
    }

    if (hasDetachedColor) {
      totalChecks++; // Only count the color check once per node for metrics
      [...new Set(nodeHexCodes)].forEach(hex => {
        if (!detachedColorsMap[hex]) detachedColorsMap[hex] = [];
        detachedColorsMap[hex].push(node.id);
      });
    } else if ('fills' in node || 'strokes' in node) {
      // If it has fills/strokes and none are detached, consider it a pass for color hygiene
      // (Only count if it actually HAS styleable properties to keep totalChecks balanced)
      if (('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) ||
        ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0)) {
        totalChecks++;
        passedChecks++;
      }
    }
    // --- END NEW: Detached Style Checks ---

    // Check 2: Default Layer Names
    if (node.name.includes('Frame') || node.name.includes('Group') ||
      node.name.includes('Rectangle') || node.name.includes('Ellipse')) {
      totalChecks++;
      if (node.name === 'Frame' || node.name === 'Group' ||
        node.name === 'Rectangle' || node.name === 'Ellipse' ||
        /^(Frame|Group|Rectangle|Ellipse)\s+\d+$/.test(node.name)) {
        errors.defaultNames.push({
          id: node.id,
          name: node.name,
          issue: 'Using default name'
        });
      } else {
        passedChecks++;
      }
    }

    // Check 3: Text Contrast (WCAG 2.1)
    if (node.type === 'TEXT') {
      totalChecks++;
      try {
        const textFills = node.fills;
        if (Array.isArray(textFills) && textFills.length > 0 && textFills !== figma.mixed) {
          const textFill = textFills[0];
          if (textFill.type === 'SOLID' && textFill.visible !== false) {
            let bgColor = { r: 1, g: 1, b: 1 };
            let parent = node.parent;
            while (parent) {
              if ('fills' in parent && Array.isArray(parent.fills) && parent.fills.length > 0) {
                const pFill = parent.fills[0];
                if (pFill.type === 'SOLID' && pFill.visible !== false) {
                  bgColor = pFill.color;
                  break;
                }
              }
              parent = parent.parent;
            }
            const fontSize = node.fontSize === figma.mixed ? 16 : node.fontSize;
            const fontWeight = node.fontWeight === figma.mixed ? 400 : node.fontWeight;
            const ratio = getContrastRatio(textFill.color, bgColor);
            const compliance = getWCAGCompliance(ratio, fontSize, fontWeight >= 700);

            if (!compliance.passAA) {
              errors.poorContrast.push({
                id: node.id,
                name: node.name,
                issue: `Low contrast: ${compliance.ratio}:1 (${compliance.level})`,
                suggestion: compliance.isLarge ? 'Needs 3:1 (AA)' : 'Needs 4.5:1 (AA)'
              });
            } else {
              passedChecks++;
            }
          } else {
            passedChecks++;
          }
        } else {
          passedChecks++;
        }
      } catch (e) {
        passedChecks++;
      }
    }

    // Check 4: Font Size
    if (node.type === 'TEXT') {
      totalChecks++;
      const fontSize = node.fontSize === figma.mixed ? 16 : node.fontSize;
      if (fontSize < 12) {
        errors.smallFonts.push({
          id: node.id,
          name: node.name,
          issue: `Font too small: ${fontSize}px`,
          suggestion: 'Minimum 12px for accessibility'
        });
      } else {
        passedChecks++;
      }
    }

    // Check 5: Touch Target Size
    const isInteractive = node.name.toLowerCase().includes('button') ||
      node.name.toLowerCase().includes('btn') ||
      node.name.toLowerCase().includes('link');
    if (isInteractive) {
      totalChecks++;
      if (node.width < 44 || node.height < 44) {
        errors.smallTouchTargets.push({
          id: node.id,
          name: node.name,
          issue: `Touch target: ${Math.round(node.width)}x${Math.round(node.height)}px`,
          suggestion: 'Minimum 44x44px (WCAG 2.1 AAA)'
        });
      } else {
        passedChecks++;
      }
    }
  }

  // Group Detached Fonts
  for (const [font, ids] of Object.entries(detachedFontsMap)) {
    errors.detachedTextStyles.push({
      id: ids, // array of ids
      name: font,
      issue: `Used on ${ids.length} layer${ids.length > 1 ? 's' : ''}`,
      suggestion: 'Connect to a typography style/variable'
    });
  }

  // Group Detached Colors
  for (const [hex, ids] of Object.entries(detachedColorsMap)) {
    errors.detachedColors.push({
      id: ids, // array of ids
      name: hex,
      issue: `Used on ${ids.length} layer${ids.length > 1 ? 's' : ''}`,
      suggestion: 'Connect fill/stroke to a color style or variable'
    });
  }

  // Sort them so most used is at top
  errors.detachedTextStyles.sort((a, b) => b.id.length - a.id.length);
  errors.detachedColors.sort((a, b) => b.id.length - a.id.length);

  // Calculate health score
  const healthScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  // Generate improvement tips based on errors
  const improvementTips = [];
  if (errors.defaultNames.length > 0) {
    improvementTips.push(`Rename ${errors.defaultNames.length} layer(s) with default names`);
  }
  if (errors.poorContrast.length > 0) {
    improvementTips.push(`Fix contrast on ${errors.poorContrast.length} text layer(s) (WCAG 2.1)`);
  }
  if (errors.smallFonts.length > 0) {
    improvementTips.push(`Increase font size on ${errors.smallFonts.length} text layer(s)`);
  }
  if (errors.smallTouchTargets.length > 0) {
    improvementTips.push(`Enlarge ${errors.smallTouchTargets.length} touch target(s) to 44x44px`);
  }
  if (errors.detachedTextStyles.length > 0) {
    improvementTips.push(`Connect ${errors.detachedTextStyles.length} text layer(s) to typography styles`);
  }
  if (errors.detachedColors.length > 0) {
    improvementTips.push(`Connect ${errors.detachedColors.length} color(s) to styles or variables`);
  }
  if (healthScore === 100) {
    improvementTips.push('Perfect! Your design meets all quality standards.');
  }

  figma.ui.postMessage({
    type: 'quality-audit-complete',
    healthScore: healthScore,
    errors: errors,
    totalChecks: totalChecks,
    passedChecks: passedChecks,
    improvementTips: improvementTips
  });
}

// ========================================
// MODULE 4: THE HANDOFF MANAGER (MANAGER LEVEL)
// Career Stage: Manager
// Focus: Process & Scalability
// Why: Managers need to track progress across multiple designers.
// Status pills provide visual indicators of design readiness,
// improving communication with developers and stakeholders.
// ========================================
async function handleSetFrameStatus(status) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one frame'
    });
    return;
  }

  // Filter for frames only
  const frames = selection.filter(node =>
    node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET'
  );

  if (frames.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select at least one frame or component'
    });
    return;
  }

  let appliedCount = 0;

  for (const frame of frames) {
    // Remove existing status pill if present
    if ('children' in frame) {
      const existingPill = frame.children.find(child =>
        child.name === '🏷️ Status Pill'
      );
      if (existingPill) {
        existingPill.remove();
      }
    }

    // Create status pill
    const pill = await createStatusPill(status);

    // Insert at top of frame
    if ('appendChild' in frame) {
      frame.appendChild(pill);

      // Move to top
      if ('children' in frame && frame.children.length > 1) {
        frame.insertChild(0, pill);
      }

      appliedCount++;
    }
  }

  figma.ui.postMessage({
    type: 'status-applied',
    count: appliedCount,
    status: status
  });
}

// ========================================
// HELPER: CREATE STATUS PILL
// Why: Creates a visual status indicator component
// ========================================
async function createStatusPill(status) {
  const statusConfig = {
    'draft': { emoji: '🔴', text: 'Draft', color: { r: 1, g: 0.36, b: 0.36 } },
    'review': { emoji: '🟡', text: 'In Review', color: { r: 1, g: 0.65, b: 0.16 } },
    'ready': { emoji: '🟢', text: 'Ready for Dev', color: { r: 0, g: 0.82, b: 0.52 } }
  };

  const config = statusConfig[status] || statusConfig['draft'];

  // Create container frame
  const container = figma.createFrame();
  container.name = '🏷️ Status Pill';
  container.resize(160, 32);
  container.layoutMode = 'HORIZONTAL';
  container.primaryAxisSizingMode = 'AUTO';
  container.counterAxisSizingMode = 'AUTO';
  container.paddingLeft = 12;
  container.paddingRight = 12;
  container.paddingTop = 8;
  container.paddingBottom = 8;
  container.itemSpacing = 8;
  container.cornerRadius = 16;

  // Set background color
  container.fills = [{
    type: 'SOLID',
    color: config.color,
    opacity: 0.15
  }];

  // Add border
  container.strokes = [{
    type: 'SOLID',
    color: config.color
  }];
  container.strokeWeight = 1.5;

  // Create text and load font first
  const text = figma.createText();

  // Try to load Inter Semi Bold, fallback to Roboto Bold
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    text.fontName = { family: 'Inter', style: 'Semi Bold' };
  } catch (error) {
    // Fallback if Inter is not available
    try {
      await figma.loadFontAsync({ family: 'Roboto', style: 'Bold' });
      text.fontName = { family: 'Roboto', style: 'Bold' };
    } catch (fallbackError) {
      // Last resort: use Roboto Regular
      await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
      text.fontName = { family: 'Roboto', style: 'Regular' };
    }
  }

  text.fontSize = 12;
  text.characters = `${config.emoji} ${config.text}`;
  text.fills = [{
    type: 'SOLID',
    color: config.color
  }];

  // Add text to container
  container.appendChild(text);

  return container;
}

// ========================================
// HELPER: CHECK FOR DETACHED COLORS
// Why: Identifies fills/strokes not linked to styles or variables
// ========================================
function checkForDetachedColors(node) {
  const issues = [];

  // Check fills
  if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
    for (let i = 0; i < node.fills.length; i++) {
      const fill = node.fills[i];
      if (fill.type === 'SOLID' && fill.visible !== false) {
        // Check if node has a fill style applied
        const hasFillStyle = 'fillStyleId' in node && node.fillStyleId && node.fillStyleId !== '';

        // Check if fill has a bound variable
        let hasBoundVariable = false;
        if ('boundVariables' in node && node.boundVariables && 'fills' in node.boundVariables) {
          const fillBindings = node.boundVariables.fills;
          if (Array.isArray(fillBindings) && fillBindings[i]) {
            hasBoundVariable = true;
          }
        }

        // Only report if neither style nor variable is bound
        if (!hasFillStyle && !hasBoundVariable) {
          const hex = rgbToHex(fill.color);
          issues.push({
            type: 'fill',
            color: hex,
            property: 'Fill'
          });
        }
      }
    }
  }

  // Check strokes
  if ('strokes' in node && node.strokes !== figma.mixed && Array.isArray(node.strokes)) {
    for (let i = 0; i < node.strokes.length; i++) {
      const stroke = node.strokes[i];
      if (stroke.type === 'SOLID' && stroke.visible !== false) {
        // Check if node has a stroke style applied
        const hasStrokeStyle = 'strokeStyleId' in node && node.strokeStyleId && node.strokeStyleId !== '';

        // Check if stroke has a bound variable
        let hasBoundVariable = false;
        if ('boundVariables' in node && node.boundVariables && 'strokes' in node.boundVariables) {
          const strokeBindings = node.boundVariables.strokes;
          if (Array.isArray(strokeBindings) && strokeBindings[i]) {
            hasBoundVariable = true;
          }
        }

        // Only report if neither style nor variable is bound
        if (!hasStrokeStyle && !hasBoundVariable) {
          const hex = rgbToHex(stroke.color);
          issues.push({
            type: 'stroke',
            color: hex,
            property: 'Stroke'
          });
        }
      }
    }
  }

  // Check effects (shadows, glows)
  if ('effects' in node && node.effects !== figma.mixed && Array.isArray(node.effects)) {
    for (const effect of node.effects) {
      if ((effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') && effect.visible !== false) {
        // Check if node has an effect style applied
        const hasEffectStyle = 'effectStyleId' in node && node.effectStyleId && node.effectStyleId !== '';

        // Note: Effects don't support bound variables yet in Figma
        if (!hasEffectStyle && effect.color) {
          const hex = rgbToHex(effect.color);
          issues.push({
            type: 'effect',
            color: hex,
            property: effect.type === 'DROP_SHADOW' ? 'Drop Shadow' : 'Inner Shadow'
          });
        }
      }
    }
  }

  // Check Typography (Text Styles)
  if (node.type === 'TEXT') {
    const hasTextStyle = node.textStyleId && node.textStyleId !== '' && node.textStyleId !== figma.mixed;
    if (!hasTextStyle) {
      // Use the text color for the swatch if possible, else black
      let textColor = '#000000';
      if (node.fills && node.fills !== figma.mixed && node.fills.length > 0 && node.fills[0].type === 'SOLID') {
        textColor = rgbToHex(node.fills[0].color);
      }
      issues.push({
        type: 'typography',
        color: textColor,
        property: 'Typography',
        isTypography: true
      });
    }
  }

  return issues;
}

// ========================================
// HELPER: CHECK TEXT CONTRAST
// Why: Basic contrast check for accessibility
// ========================================
function checkTextContrast(textNode) {
  if (!('fills' in textNode) || !Array.isArray(textNode.fills)) {
    return null;
  }

  const textFill = textNode.fills.find(fill => fill.type === 'SOLID');
  if (!textFill) {
    return null;
  }

  // Check if text color is too light (potential contrast issue)
  const { r, g, b } = textFill.color;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // If luminance is very high (close to white) and no background, flag it
  if (luminance > 0.9) {
    return {
      issue: 'Text may have poor contrast (very light color)',
      suggestion: 'Use darker text color or add a dark background for better readability'
    };
  }

  // If luminance is very low (close to black) on potentially dark background
  if (luminance < 0.1) {
    return {
      issue: 'Text may have poor contrast (very dark color)',
      suggestion: 'Use lighter text color or add a light background for better readability'
    };
  }

  return null;
}

// ========================================
// HELPER: FIND CLOSEST COLOR VARIABLE
// Suggests which variable to use based on color similarity
// ========================================
function findClosestColorVariable(hexColor, colorSources) {
  if (!colorSources || colorSources.length === 0) {
    return null;
  }

  // Convert HEX to RGB
  const hex = hexColor.replace('#', '');
  const r1 = parseInt(hex.substr(0, 2), 16) / 255;
  const g1 = parseInt(hex.substr(2, 2), 16) / 255;
  const b1 = parseInt(hex.substr(4, 2), 16) / 255;

  let closestMatch = null;
  let smallestDistance = Infinity;

  for (const source of colorSources) {
    const { r: r2, g: g2, b: b2 } = source.color;

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    );

    if (distance < smallestDistance) {
      smallestDistance = distance;
      const varHex = rgbToHex(source.color);
      closestMatch = {
        name: source.name,
        hex: varHex,
        // Normalize similarity: max distance is ~1.732. Map 0-1.732 to 100-0%
        // Using a steeper curve for better relevance: 1 - distance * 2 (clamped)
        similarity: Math.max(0, Math.round((1 - distance / 1.732) * 100))
      };
    }
  }

  // Threshold: > 90% (Distance < ~0.17)
  if (closestMatch && closestMatch.similarity >= 90) {
    return closestMatch;
  }

  return null;
}


// ========================================
// HELPER: RGB TO HEX CONVERSION
// Why: Converts Figma RGB (0-1) to HEX format
// ========================================
function rgbToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// ========================================
// HELPER: COLLECT ALL NODES
// Why: Recursively collects all nodes in a tree
// ========================================
function collectAllNodes(node, collection) {
  const stack = [node];

  while (stack.length > 0) {
    const currentNode = stack.pop();
    collection.push(currentNode);

    // Skip children of components/instances to avoid auditing their internals
    if ('children' in currentNode) {
      if (currentNode.type !== 'COMPONENT' && currentNode.type !== 'INSTANCE' && currentNode.type !== 'COMPONENT_SET') {
        for (let i = currentNode.children.length - 1; i >= 0; i--) {
          stack.push(currentNode.children[i]);
        }
      }
    }
  }
}



// ========================================
// ATOMIC NAME GENERATION ALGORITHM
// Why: Applies Atomic Design principles to layer naming
// Junior Level Learning: This teaches the hierarchy of design elements
// ========================================}

// ========================================
// NAMING CONVENTION SYSTEM
// Enterprise-grade naming with support for:
// - Atomic Design (default)
// - Slash Structure (Button / Primary)
// - BEM Style (button__primary)
// - Component Library (Button/Primary)
// - Architect Mode (semantic layout)
// ========================================

async function generateName(node, casing = 'pascal', convention = 'atomic', prefs = {}) {
  // First generate base name using atomic/hierarchical logic
  let baseName = await generateAtomicName(node, casing, prefs);

  // If null, the node should be skipped (e.g. text with no connected style)
  if (baseName === null) return null;

  // Apply convention-specific transformations
  switch (convention) {
    case 'component':
      baseName = convertToComponent(baseName);
      break;
    case 'semantic':
      baseName = convertToSemantic(node, baseName);
      break;
    case 'handoff':
      baseName = convertToHandoff(node, baseName);
      break;
    // 'atomic' (Hierarchical) uses the base name as-is
  }

  return baseName;
}

// ========================================
// CONVENTION: COMPONENT (replaces Slash)
// Groups related layers for component libraries.
// Detects common word prefix and produces Figma slash notation.
// Example: "ButtonPrimary" → "Button / Primary"
//          "card-hero"     → "Card / Hero"
// ========================================
function convertToComponent(name) {
  // Normalize: remove existing slashes, replace hyphens/underscores with spaces
  let normalized = name.replace(/\s*\/\s*/g, ' ').replace(/[-_]/g, ' ').trim();

  // Split on spaces or PascalCase boundaries
  const words = normalized
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase split
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  if (words.length <= 1) {
    return words[0] || name;
  }

  // First word = group (component name), rest = variant
  const group = words[0];
  const variant = words.slice(1).join(' ');
  return `${group} / ${variant}`;
}

// ========================================
// CONVENTION: HANDOFF (replaces Architect)
// Produces semantic HTML-like names developers can map directly.
// Reads node structure: layout mode, fills, type, depth.
// Examples:
//   Auto-layout horizontal  → nav / {name}
//   Auto-layout vertical    → list / {name}
//   Image fill              → img / {name}
//   VECTOR / SHAPE          → icon / {name}
//   TEXT                    → text / {name}
//   Top-level FRAME         → section / {name}
//   Generic FRAME           → card / {name}
// ========================================
function convertToHandoff(node, baseName) {
  // Normalize base name to kebab-case for HTML readability
  const kebab = baseName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'layer';

  // VECTOR / SHAPES → icon
  if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'POLYGON' ||
    node.type === 'ELLIPSE' || node.type === 'LINE') {
    return `icon/${kebab}`;
  }

  // TEXT → text
  if (node.type === 'TEXT') {
    return `text/${kebab}`;
  }

  // RECTANGLE with image fill → img
  if (node.type === 'RECTANGLE' && hasImageFill(node)) {
    return `img/${kebab}`;
  }

  // FRAME / GROUP — detect by layout
  if ((node.type === 'FRAME' || node.type === 'GROUP') && 'children' in node) {
    // Top-level frames (direct children of page) → section
    if (node.parent && node.parent.type === 'PAGE') {
      return `section/${kebab}`;
    }

    // Auto-layout horizontal → nav
    if ('layoutMode' in node && node.layoutMode === 'HORIZONTAL') {
      // Check if it looks like a navigation bar (single row of items)
      const childCount = node.children ? node.children.length : 0;
      return childCount >= 3 ? `nav/${kebab}` : `hstack/${kebab}`;
    }

    // Auto-layout vertical → list
    if ('layoutMode' in node && node.layoutMode === 'VERTICAL') {
      return `list/${kebab}`;
    }

    // Generic frame → card or wrapper
    const childCount = node.children ? node.children.length : 0;
    return childCount <= 2 ? `wrapper/${kebab}` : `card/${kebab}`;
  }

  return kebab;
}

// ========================================
// CONVENTION: SEMANTIC
// Detects real UI patterns from node structure, layout, dimensions,
// child composition and border radius — names in the shared vocabulary
// that both designers and developers already know.
//
// Detection priority:
//   1. Node type (Vector, Text, Image, Ellipse)
//   2. Shape analysis (circle = avatar, thin = divider)
//   3. Top-level frame analysis (navbar, hero, sidebar, section)
//   4. Child composition (badge, card, tabs, form, list, btn...)
// ========================================
function convertToSemantic(node, baseName) {

  // ── 1. Leaf types ─────────────────────────────────────────────────

  if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'LINE') {
    return 'icon';
  }

  if (node.type === 'TEXT') {
    const size = typeof node.fontSize === 'number' ? node.fontSize : 14;
    if (size >= 32) return 'heading';
    if (size >= 20) return 'subheading';
    if (size >= 14) return 'body-text';
    return 'caption';
  }

  if (node.type === 'ELLIPSE') {
    return hasImageFill(node) ? 'avatar' : 'shape';
  }

  if (node.type === 'RECTANGLE') {
    const h = node.height || 1;
    const w = node.width || 1;
    // Very thin = divider
    if (h <= 2 || w <= 2) return 'divider';
    // Image fills → detect by aspect ratio
    if (hasImageFill(node)) {
      const ratio = w / h;
      if (ratio > 3) return 'banner';
      if (ratio > 1.5) return 'thumbnail';
      if (Math.abs(ratio - 1) < 0.25) return 'avatar';
      return 'media';
    }
    return 'shape';
  }

  // ── 2. Frame / Group ─────────────────────────────────────────────

  if ((node.type === 'FRAME' || node.type === 'GROUP') && 'children' in node) {
    const children = node.children || [];
    const childCount = children.length;
    const layoutMode = node.layoutMode || 'NONE';
    const isTopLevel = node.parent && node.parent.type === 'PAGE';
    const isHoriz = layoutMode === 'HORIZONTAL';
    const isVert = layoutMode === 'VERTICAL';
    const w = node.width || 0;
    const h = node.height || 0;

    if (childCount === 0) return 'placeholder';

    // ── Top-level frames (direct children of page) ──────────────────
    if (isTopLevel) {
      if (isHoriz && h < 100 && h > 0) return 'top-bar';
      if (isVert && w < 300 && w > 0) return 'side-panel';
      return 'section';
    }

    // ── Child classification ─────────────────────────────────────────
    const frameKids = children.filter(c => c.type === 'FRAME' || c.type === 'GROUP' ||
      c.type === 'COMPONENT' || c.type === 'INSTANCE');
    const textKids = children.filter(c => c.type === 'TEXT');
    const vectorKids = children.filter(c => c.type === 'VECTOR' || c.type === 'STAR' ||
      c.type === 'POLYGON' || c.type === 'LINE');
    const imageKids = children.filter(c => hasImageFill(c));
    const cr = typeof node.cornerRadius === 'number' ? node.cornerRadius : 0;

    // ── SIGNAL A: Drop Shadow ──────────────────────────────────────
    // The #1 indicator of a floating/elevated component (card, popup, panel).
    // Flat layout elements (rows, sections, wrappers) rarely have shadows.
    const effects = Array.isArray(node.effects) ? node.effects : [];
    const hasShadow = effects.some(e => e.type === 'DROP_SHADOW' && e.visible !== false);

    // ── SIGNAL B: Visible Stroke (border) ──────────────────────────
    // Input fields, bordered cards, and panels have explicit strokes.
    const strokes = Array.isArray(node.strokes) ? node.strokes : [];
    const hasStroke = strokes.some(s => s.visible !== false && (s.opacity == null || s.opacity > 0.1));

    // ── SIGNAL C: Fill + Padding ───────────────────────────────────
    const fills = Array.isArray(node.fills) ? node.fills : [];
    const hasVisibleFill = fills.some(f => f.type === 'SOLID' && (f.opacity == null || f.opacity > 0.05));
    const hasPadding = (node.paddingLeft || 0) > 4 || (node.paddingRight || 0) > 4;

    // ── Badge / Chip — small, pill-shape ────────────────────────────
    if (h > 0 && h < 40 && w < 200 && cr >= h / 2 && childCount <= 3) return 'badge';

    // ── Avatar — perfectly round/square frame ───────────────────────
    if (Math.abs(w - h) <= 4 && w > 0 && cr >= w / 2) return 'avatar';

    // ── Icon button — tiny frame with a single vector ────────────────
    if (vectorKids.length > 0 && childCount === 1 && w < 56 && h < 56) return 'icon-btn';

    // ── Input field — stroke + no fill + short + wide ────────────────
    // Input fields are bordered, usually unfilled, short (<64px), wider than tall.
    if (hasStroke && !hasVisibleFill && h > 0 && h < 64 && w > h * 2) return 'input';

    // ── Button / CTA ─────────────────────────────────────────────────
    // Must have: fill + padding + small height + SHORT text (≤30 chars).
    // Long text (>30 chars) = label/row/content, not a button.
    const allText = textKids.map(t => { try { return t.characters || ''; } catch (e) { return ''; } }).join(' ');
    const isShortLabel = allText.trim().length > 0 && allText.trim().length <= 30;
    if (h < 56 && h > 0 && hasVisibleFill && hasPadding && isShortLabel && frameKids.length === 0) {
      return hasShadow ? 'cta-btn' : 'btn'; // shadowed btn = primary CTA
    }

    // ── Card — shadow + image + content (high confidence) ────────────
    if (hasShadow && imageKids.length > 0 && (textKids.length > 0 || frameKids.length > 0)) {
      return 'card';
    }

    // ── Popup — shadow + small + rounded (tooltip / dropdown / popover)
    if (hasShadow && w < 300 && h < 200 && cr >= 8) return 'popup';

    // ── Panel — (shadow OR stroke) + large + rounded ──────────────────
    if ((hasShadow || hasStroke) && w > 300 && h > 200 && cr >= 8 && frameKids.length >= 2) {
      return 'panel';
    }

    // ── Content block — image + content without shadow (flat) ─────────
    if (imageKids.length > 0 && (textKids.length > 0 || frameKids.length > 0)) {
      return 'content-block';
    }

    // ── Stack — vertical group of repeated child frames ───────────────
    if (isVert && frameKids.length >= 2) return 'stack';

    // ── Row — any horizontal layout group ────────────────────────────
    if (isHoriz) return 'row';

    // ── Stack — any vertical layout group ────────────────────────────
    if (isVert) return 'stack';

    // ── Wrapper — single-child container ──────────────────────────────
    if (childCount === 1) return 'wrapper';

    return 'group';
  }

  // Absolute fallback
  return baseName.toLowerCase().replace(/\s+/g, '-') || 'layer';
}




// ========================================
// HELPER: GENERATE ATOMIC NAME (Original Logic)
// ========================================
// ========================================
// HIERARCHICAL NAME GENERATION
// Naming Hierarchy:
// 1. Content = Single text/shape
// 2. Item = Multiple Content (Group/Frame/Auto Layout)
// 3. Container = Multiple Items
// 4. Section = Multiple Containers
// 5. Block = Multiple Sections
// ========================================
async function generateAtomicName(node, casing = 'pascal', prefs = {}) {
  // IMPORTANT: Don't rename design system components
  if (isDesignSystemComponent(node)) {
    return node.name; // Keep original name
  }

  let baseName = '';

  // Level 1: TEXT - Rename based on connected style, or by content if setting is ON, or fallback to content.
  if (node.type === 'TEXT') {
    // If user explicitly wants to use text content instead of style names
    if (prefs && prefs.textRenameContent) {
      baseName = node.characters.trim().substring(0, 40) || 'Content';
    }
    // Otherwise, try to use connected text style
    else {
      if (typeof node.textStyleId === 'string' && node.textStyleId.length > 0) {
        const textStyle = await resolveTextStyle(node.textStyleId);
        if (textStyle && textStyle.name) {
          return textStyle.name; // Use the exact style name — no changes
        }
      }
      // No style connected → fall back to the actual text content anyway (better than generic "Content")
      baseName = node.characters.trim().substring(0, 40) || 'Content';
    }
  }
  // LEVEL 1: IMAGES - Any image file
  else if (node.type === 'RECTANGLE' && hasFills(node) && hasImageFill(node)) {
    baseName = 'Img';
  }
  // LEVEL 1: SHAPES - Vector, shapes without images
  else if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'POLYGON' ||
    node.type === 'ELLIPSE' || node.type === 'LINE' ||
    (node.type === 'RECTANGLE' && !hasImageFill(node))) {
    baseName = 'Shape';
  }
  // LEVEL 2-5: HIERARCHICAL - Groups/Frames/Auto Layouts
  else if ((node.type === 'FRAME' || node.type === 'GROUP') && 'children' in node) {
    // Skip top-level frames (direct children of the page — Mobile/Tablet/Desktop frames)
    if (node.parent && node.parent.type === 'PAGE') {
      return node.name; // Keep name as-is
    }
    baseName = determineHierarchyLevel(node);
  }
  else {
    baseName = 'Content'; // Default to Content
  }

  return applyCasing(baseName, casing);
}

// ========================================
// HELPER: DETERMINE HIERARCHY LEVEL
// Analyzes nesting depth to assign correct level
// ========================================
function determineHierarchyLevel(node) {
  // Count how many children are groups/frames (nested levels)
  let nestedGroupCount = 0;
  let maxChildDepth = 0;

  for (const child of node.children) {
    if ((child.type === 'FRAME' || child.type === 'GROUP') && 'children' in child) {
      nestedGroupCount++;
      const childDepth = getNodeDepth(child);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
  }

  // New hierarchy:
  // item      = 1st group / leaf frame (no nested group children)
  // container = frame that holds multiple items (1 level deep)
  // section   = holds multiple containers (2 levels deep)
  // block     = holds multiple sections (3+ levels deep)
  if (maxChildDepth >= 2) {
    return 'Block';        // Holds sections
  } else if (maxChildDepth === 1) {
    return 'Section';      // Holds containers
  } else if (nestedGroupCount > 0) {
    return 'Container';    // Holds items
  } else {
    return 'Item';         // Leaf frame / 1st group
  }
}

// ========================================
// HELPER: GET NODE DEPTH
// Recursively calculates nesting depth
// ========================================
function getNodeDepth(node) {
  if (!('children' in node) || node.children.length === 0) {
    return 0;
  }

  let maxDepth = 0;
  for (const child of node.children) {
    if (child.type === 'FRAME' || child.type === 'GROUP') {
      const childDepth = getNodeDepth(child);
      maxDepth = Math.max(maxDepth, childDepth + 1);
    }
  }

  return maxDepth;
}

// ========================================
// HELPER: DETECT DESIGN SYSTEM COMPONENTS
// Prevents renaming of component library items
// ========================================
function isDesignSystemComponent(node) {
  // Check if it's a component or component set
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    return true;
  }

  // Check if it's an instance of a component
  if (node.type === 'INSTANCE') {
    return true;
  }

  // Check if parent is a component (nested in component)
  let parent = node.parent;
  while (parent) {
    if (parent.type === 'COMPONENT' || parent.type === 'COMPONENT_SET') {
      return true;
    }
    parent = parent.parent;
  }

  return false;
}

// ========================================
// HELPER: CHECK IF TEXT HAS STYLE
// Detects if text is connected to design system text style
// ========================================
function hasTextStyle(node) {
  if (node.type !== 'TEXT') return false;
  return node.textStyleId && node.textStyleId !== '';
}

// ========================================
// HELPER: CHECK IF NODE HAS FILLS
// ========================================
function hasFills(node) {
  return 'fills' in node && node.fills && node.fills.length > 0;
}

// ========================================
// HELPER: CHECK IF NODE HAS IMAGE FILL
// ========================================
function hasImageFill(node) {
  if (!hasFills(node)) return false;
  const fills = Array.isArray(node.fills) ? node.fills : [node.fills];
  return fills.some(fill => fill.type === 'IMAGE');
}

// ========================================
// HELPER: GET TEXT CONTENT
// ========================================
function getTextContent(textNode) {
  try {
    return textNode.characters.trim();
  } catch (error) {
    return '';
  }
}

// ========================================
// HELPER: SANITIZE TEXT
// ========================================
function sanitizeText(text, maxLength = 20) {
  let cleaned = text.replace(/[^a-zA-Z0-9\s]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength).trim();
  }

  return cleaned.replace(/\s+/g, '');
}

// ========================================
// HELPER: GET SHAPE DESCRIPTOR
// ========================================
function getShapeDescriptor(node) {
  const typeMap = {
    'VECTOR': 'Vector',
    'STAR': 'Star',
    'POLYGON': 'Polygon',
    'ELLIPSE': 'Circle',
    'LINE': 'Line',
    'RECTANGLE': 'Rect'
  };
  return typeMap[node.type] || 'Shape';
}

// ========================================
// HELPER: GET CHILD TYPES
// ========================================
function getChildTypes(node) {
  const types = new Set();
  if ('children' in node) {
    for (const child of node.children) {
      types.add(child.type);
    }
  }
  return types;
}

// ========================================
// HELPER: FIND PRIMARY TEXT
// ========================================
function findPrimaryText(node) {
  if ('children' in node) {
    for (const child of node.children) {
      if (child.type === 'TEXT') {
        const content = getTextContent(child);
        if (content) return content;
      }
      if ('children' in child) {
        const nestedText = findPrimaryText(child);
        if (nestedText) return nestedText;
      }
    }
  }
  return null;
}

// ========================================
// HELPER: DETECT CHILD PATTERN
// ========================================
function detectChildPattern(node) {
  if (!('children' in node) || node.children.length === 0) {
    return null;
  }

  const firstChildName = node.children[0].name;
  const pattern = firstChildName.replace(/\s*\d+\s*$/, '').trim();

  if (pattern) {
    return sanitizeText(pattern, 15);
  }

  return node.children[0].type.charAt(0) + node.children[0].type.slice(1).toLowerCase();
}

// ========================================
// HELPER: APPLY CASING
// ========================================
function applyCasing(text, casing) {
  if (!text) return text;

  if (casing === 'kebab') {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  } else {
    return text
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

// ========================================
// LOCATE NODE HANDLER
// Why: Allows users to click on errors and jump to the layer
// ========================================
async function handleLocateNode(nodeIdStr) {
  try {
    const ids = nodeIdStr.split(',');
    const nodesToSelect = [];

    for (const id of ids) {
      if (!id) continue;
      const node = await figma.getNodeByIdAsync(id);
      if (node) nodesToSelect.push(node);
    }

    if (nodesToSelect.length > 0) {
      // Select the node(s)
      figma.currentPage.selection = nodesToSelect;

      // Zoom to the node(s)
      figma.viewport.scrollAndZoomIntoView(nodesToSelect);

      const nameStr = nodesToSelect.length === 1 ? nodesToSelect[0].name : `${nodesToSelect.length} layers`;
      figma.ui.postMessage({
        type: 'node-located',
        nodeName: nameStr
      });
    } else {
      figma.ui.postMessage({
        type: 'error',
        message: 'Layer not found'
      });
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Could not locate layer'
    });
  }
}

// ========================================
// ARCHITECT MODE: ASSIGN REGION
// Why: Stores selected frame ID for header/body/footer zones
// ========================================
async function handleAssignRegion(region) {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) {
    figma.ui.postMessage({ type: 'toast', message: '⚠️ Please select exactly one frame' });
    return;
  }

  const node = selection[0];
  if (node.type !== 'FRAME') {
    figma.ui.postMessage({ type: 'toast', message: '❌ Selected node must be a Frame' });
    return;
  }

  const regions = await figma.clientStorage.getAsync('architect-regions') || {};
  regions[region] = node.id;
  await figma.clientStorage.setAsync('architect-regions', regions);

  figma.ui.postMessage({ type: 'region-assigned', region: region });
}

// ========================================
// ARCHITECT MODE: FLEXBOX-AWARE RENAME
// Integrated into Auto-Rename when Architect convention is selected
// ========================================
async function handleArchitectModeRename(casing, filters) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'rename-complete',
      count: 0
    });
    return;
  }

  let processedCount = 0;

  for (const node of selection) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT') {

      // Apply filters
      if (filters.skipLocked && node.locked) continue;
      if (filters.skipHidden && !node.visible) continue;

      // Step 1: Rename parent to section.[name] if it has children
      if ('children' in node && node.children.length > 0) {
        const baseName = node.name.replace(/^(section\.|Section\s)/i, '');
        node.name = `section.${applyCasing(baseName, casing)}`;
        processedCount++;

        // Step 2: Detect layout mode and rename children
        const layoutMode = node.layoutMode;
        const layoutWrap = node.layoutWrap;
        const itemSpacing = node.itemSpacing || 0;
        const primaryAxisSizingMode = node.primaryAxisSizingMode;

        for (const child of node.children) {
          // Apply filters to children
          if (filters.skipLocked && child.locked) continue;
          if (filters.skipHidden && !child.visible) continue;

          // Skip component instances - keep original name
          if (child.type === 'INSTANCE' || child.type === 'COMPONENT' || child.type === 'COMPONENT_SET') {
            continue;
          }

          // Only rename frames
          if (child.type !== 'FRAME') {
            continue;
          }

          let suffix = 'item'; // Default

          // Flexbox-based detection
          if (layoutWrap === 'WRAP') {
            suffix = 'grid-item';
          } else if (layoutMode === 'HORIZONTAL' && primaryAxisSizingMode === 'FIXED') {
            suffix = 'card-item';
          } else if (layoutMode === 'VERTICAL' && itemSpacing === 0) {
            suffix = 'list-item';
          } else if (layoutMode === 'VERTICAL') {
            suffix = 'list-item';
          } else if (layoutMode === 'HORIZONTAL') {
            suffix = 'card-item';
          }

          // Clean existing suffix and apply new one
          let baseName = child.name.replace(/-(card|list|grid)?-?item$/i, '');
          child.name = `${applyCasing(baseName, casing)}-${suffix}`;
          processedCount++;
        }
      }
    }
  }

  figma.ui.postMessage({
    type: 'auto-rename-complete',
    count: processedCount,
    stats: {} // Empty stats for now
  });
}



// ========================================
// UNDO/REDO HANDLERS
// ========================================
async function handleUndo() {
  const state = undoManager.undo();

  if (!state) {
    figma.notify('Nothing to undo');
    return;
  }

  let restoredCount = 0;

  // Restore old names
  for (const change of state.changes) {
    try {
      const node = figma.getNodeById(change.id);
      if (node && 'name' in node) {
        node.name = change.oldName;
        restoredCount++;
      }
    } catch (error) {
      // Node might have been deleted
      console.warn(`Could not restore node ${change.id}:`, error);
    }
  }

  figma.notify(`Undone: ${restoredCount} layer(s) restored`);

  figma.ui.postMessage({
    type: 'history-updated',
    canUndo: undoManager.canUndo(),
    canRedo: undoManager.canRedo()
  });
}

async function handleRedo() {
  const state = undoManager.redo();

  if (!state) {
    figma.notify('Nothing to redo');
    return;
  }

  let restoredCount = 0;

  // Restore new names
  for (const change of state.changes) {
    try {
      const node = figma.getNodeById(change.id);
      if (node && 'name' in node && change.newName) {
        node.name = change.newName;
        restoredCount++;
      }
    } catch (error) {
      // Node might have been deleted
      console.warn(`Could not restore node ${change.id}:`, error);
    }
  }

  figma.notify(`Redone: ${restoredCount} layer(s) restored`);

  figma.ui.postMessage({
    type: 'history-updated',
    canUndo: undoManager.canUndo(),
    canRedo: undoManager.canRedo()
  });
}

// ========================================
// LOAD PREFERENCES
// Why: Restores user's last active tab and saved settings
// ========================================
async function loadPreferences() {
  const tab = await figma.clientStorage.getAsync('lastActiveTab') || 'clean';
  const prefs = await figma.clientStorage.getAsync('userSettings') || {};

  // First tell UI to switch tab
  figma.ui.postMessage({
    type: 'load-preferences',
    tab: tab,
    prefs: prefs
  });
}


// ========================================
// INITIALIZATION
// ========================================
loadPreferences();