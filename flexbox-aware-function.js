// Flexbox-Aware Auto-Structure Function
// Replace the existing handleAutoStructure function (around line 1732-1800) with this:

async function handleAutoStructure() {
    try {
        const selection = figma.currentPage.selection;

        if (selection.length === 0) {
            figma.ui.postMessage({
                type: 'operation-complete',
                message: '⚠️ Please select a frame to structure',
                target: 'auto-structure-btn'
            });
            return;
        }

        let processedCount = 0;

        for (const node of selection) {
            if (node.type === 'FRAME' || node.type === 'COMPONENT') {

                // Step 1: Rename parent to section.[name] if it has children
                if ('children' in node && node.children.length > 0) {
                    const baseName = node.name.replace(/^(section\.|Section\s)/i, '');
                    node.name = `section.${applyCasing(baseName, 'kebab')}`;

                    // Step 2: Detect layout mode and rename children
                    const layoutMode = node.layoutMode;
                    const layoutWrap = node.layoutWrap;
                    const itemSpacing = node.itemSpacing || 0;
                    const primaryAxisSizingMode = node.primaryAxisSizingMode;

                    for (const child of node.children) {
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
                        child.name = `${applyCasing(baseName, 'kebab')}-${suffix}`;
                        processedCount++;
                    }
                }
            }
        }

        figma.ui.postMessage({
            type: 'operation-complete',
            message: `✅ Structured ${processedCount} items with Flexbox-aware naming!`,
            target: 'auto-structure-btn'
        });
    } catch (error) {
        figma.ui.postMessage({
            type: 'operation-complete',
            message: `❌ Error: ${error.message}`,
            target: 'auto-structure-btn'
        });
    }
}
