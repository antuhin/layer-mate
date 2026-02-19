
// ========================================
// DESIGN OS: MODULE 1 - SCAFFOLDING
// Generate semantic page shell with header/main/footer
// ========================================
async function handleGeneratePageShell() {
    try {
        // Create Desktop frame (1440px width)
        const desktopFrame = figma.createFrame();
        desktopFrame.name = 'Desktop-1440';
        desktopFrame.resize(1440, 1024);
        desktopFrame.layoutMode = 'VERTICAL';
        desktopFrame.primaryAxisSizingMode = 'AUTO';
        desktopFrame.counterAxisSizingMode = 'FIXED';
        desktopFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Header: Global-Nav (80px, top)
        const header = figma.createFrame();
        header.name = 'header.Global-Nav';
        header.resize(1440, 80);
        header.layoutMode = 'HORIZONTAL';
        header.primaryAxisSizingMode = 'FIXED';
        header.counterAxisSizingMode = 'FIXED';
        header.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
        header.layoutAlign = 'STRETCH';
        desktopFrame.appendChild(header);

        // Main: Content (fill height, middle)
        const main = figma.createFrame();
        main.name = 'main.Content';
        main.resize(1440, 744); // Remaining height
        main.layoutMode = 'VERTICAL';
        main.primaryAxisSizingMode = 'FIXED';
        main.counterAxisSizingMode = 'FIXED';
        main.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        main.layoutAlign = 'STRETCH';
        desktopFrame.appendChild(main);

        // Footer: Global (200px, bottom)
        const footer = figma.createFrame();
        footer.name = 'footer.Global';
        footer.resize(1440, 200);
        footer.layoutMode = 'HORIZONTAL';
        footer.primaryAxisSizingMode = 'FIXED';
        footer.counterAxisSizingMode = 'FIXED';
        footer.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        footer.layoutAlign = 'STRETCH';
        desktopFrame.appendChild(footer);

        // Add to current page
        figma.currentPage.appendChild(desktopFrame);
        figma.currentPage.selection = [desktopFrame];
        figma.viewport.scrollAndZoomIntoView([desktopFrame]);

        figma.ui.postMessage({
            type: 'operation-complete',
            message: '✅ Page shell generated with semantic structure!',
            target: 'generate-shell-btn'
        });
    } catch (error) {
        figma.ui.postMessage({
            type: 'operation-complete',
            message: `❌ Error: ${error.message}`,
            target: 'generate-shell-btn'
        });
    }
}

// ========================================
// DESIGN OS: MODULE 2 - SMART ENGINE
// Auto-structure content with layout detection
// ========================================
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
                // Rename immediate children to section.[Name]
                for (const child of node.children) {
                    if (child.type === 'FRAME' || child.type === 'COMPONENT') {
                        const baseName = child.name.replace(/^(section\.|Section\s)/i, '');
                        child.name = `section.${applyCasing(baseName, 'kebab')}`;

                        // Detect layout and rename grandchildren
                        if ('layoutMode' in child && child.children) {
                            const layoutMode = child.layoutMode;

                            for (const grandchild of child.children) {
                                let suffix = 'Item';

                                // Layout detection
                                if (layoutMode === 'HORIZONTAL') {
                                    suffix = 'Card-Item';
                                } else if (layoutMode === 'VERTICAL') {
                                    suffix = 'List-Item';
                                } else if (layoutMode === 'NONE') {
                                    // Check if it's wrapped (grid-like)
                                    suffix = 'Grid-Item';
                                }

                                // Component detection (button-like)
                                if (isButtonLike(grandchild)) {
                                    grandchild.name = 'button.Primary';
                                } else {
                                    const itemName = grandchild.name.replace(/-(Card|List|Grid)-Item$/i, '');
                                    grandchild.name = `${applyCasing(itemName, 'kebab')}-${suffix}`;
                                }
                            }
                        }

                        processedCount++;
                    }
                }
            }
        }

        figma.ui.postMessage({
            type: 'operation-complete',
            message: `✅ Structured ${processedCount} sections with intelligent naming!`,
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

// Helper: Detect button-like components
function isButtonLike(node) {
    if (node.type !== 'FRAME' && node.type !== 'COMPONENT') return false;

    // Check for padding
    const hasPadding = node.paddingLeft > 0 || node.paddingRight > 0;

    // Check for centered text child
    let hasCenteredText = false;
    if (node.children) {
        for (const child of node.children) {
            if (child.type === 'TEXT') {
                hasCenteredText = true;
                break;
            }
        }
    }

    return hasPadding && hasCenteredText;
}

// ========================================
// DESIGN OS: MODULE 3 - VISUAL SPECS
// Create/remove visual overlay with section labels
// ========================================
async function handleToggleVisualOverlay(enabled) {
    try {
        if (enabled) {
            await createVisualOverlay();
        } else {
            await removeVisualOverlay();
        }
    } catch (error) {
        figma.ui.postMessage({
            type: 'operation-complete',
            message: `❌ Error: ${error.message}`,
            target: 'visual-overlay-toggle'
        });
    }
}

async function createVisualOverlay() {
    // Remove existing overlay first
    await removeVisualOverlay();

    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'toast',
            message: '⚠️ Please select frames to visualize'
        });
        return;
    }

    // Create overlay container
    const overlay = figma.createFrame();
    overlay.name = '🔒 Visual-Overlay';
    overlay.resize(figma.viewport.bounds.width, figma.viewport.bounds.height);
    overlay.x = figma.viewport.bounds.x;
    overlay.y = figma.viewport.bounds.y;
    overlay.fills = [];
    overlay.locked = true;

    // Process each selected frame
    for (const node of selection) {
        if (node.type === 'FRAME' || node.type === 'COMPONENT') {
            // Find sections
            for (const child of node.children) {
                if (child.name.startsWith('section.')) {
                    // Create red dashed rectangle
                    const boundary = figma.createRectangle();
                    boundary.name = `Section-Boundary-${child.name}`;
                    boundary.resize(child.width, child.height);
                    boundary.x = child.absoluteTransform[0][2];
                    boundary.y = child.absoluteTransform[1][2];
                    boundary.fills = [];
                    boundary.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
                    boundary.strokeWeight = 2;
                    boundary.dashPattern = [4, 4];
                    overlay.appendChild(boundary);

                    // Create text label
                    const label = figma.createText();
                    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
                    label.name = `Section-Label-${child.name}`;
                    label.characters = `🏷️ ${child.name.toUpperCase()} | ${getLayoutType(child)}`;
                    label.fontSize = 12;
                    label.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
                    label.x = child.absoluteTransform[0][2];
                    label.y = child.absoluteTransform[1][2] - 20;
                    overlay.appendChild(label);
                }
            }
        }
    }

    figma.currentPage.appendChild(overlay);

    figma.ui.postMessage({
        type: 'toast',
        message: '✅ Visual overlay created!'
    });
}

async function removeVisualOverlay() {
    const overlays = figma.currentPage.findAll(node => node.name === '🔒 Visual-Overlay');
    for (const overlay of overlays) {
        overlay.remove();
    }

    if (overlays.length > 0) {
        figma.ui.postMessage({
            type: 'toast',
            message: '✅ Visual overlay removed!'
        });
    }
}

function getLayoutType(node) {
    if (!('layoutMode' in node)) return 'Static Layout';

    switch (node.layoutMode) {
        case 'HORIZONTAL':
            return 'Horizontal Layout';
        case 'VERTICAL':
            return 'Vertical Layout';
        default:
            return 'Grid Layout';
    }
}
