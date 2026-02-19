
// ========================================
// ARCHITECT MODE: FLEXBOX-AWARE RENAME
// Integrated into Auto-Rename when Architect convention is selected
// ========================================
async function handleArchitectModeRename(casing, filters) {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'rename-complete',
            count: 0,
            message: '⚠️ Please select frames to structure'
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
                        // Wrapped layout = Grid
                        suffix = 'grid-item';
                    } else if (layoutMode === 'HORIZONTAL' && primaryAxisSizingMode === 'FIXED') {
                        // Horizontal + Fixed = Card
                        suffix = 'card-item';
                    } else if (layoutMode === 'VERTICAL' && itemSpacing === 0) {
                        // Vertical + No Gap = List
                        suffix = 'list-item';
                    } else if (layoutMode === 'VERTICAL') {
                        // Vertical with gap = Stack (still list-like)
                        suffix = 'list-item';
                    } else if (layoutMode === 'HORIZONTAL') {
                        // Horizontal with other settings = Card
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
        type: 'rename-complete',
        count: processedCount,
        message: `✅ Structured ${processedCount} layers with Flexbox-aware naming!`
    });
}
