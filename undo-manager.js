// ========================================
// UNDO/REDO MANAGER
// Manages state history for layer renaming operations
// ========================================

class UndoManager {
    constructor(maxHistory = 20) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
    }

    // Capture state before action
    captureState(actionType, nodes) {
        const state = {
            type: actionType,
            timestamp: Date.now(),
            changes: nodes.map(node => ({
                id: node.id,
                oldName: node.name,
                newName: null // Will be set after action
            }))
        };

        // Remove any states after current index (branching)
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new state
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        return state;
    }

    // Update state with new names after action
    updateState(state, nodes) {
        state.changes.forEach((change, i) => {
            if (nodes[i]) {
                change.newName = nodes[i].name;
            }
        });
    }

    // Undo last action
    undo() {
        if (!this.canUndo()) return null;
        const state = this.history[this.currentIndex];
        this.currentIndex--;
        return state;
    }

    // Redo last undone action
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

// Export for use in code.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UndoManager;
}
