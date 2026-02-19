// ========================================
// ADVANCED RENAMING FEATURES - EVENT HANDLERS
// ========================================

(function () {
    'use strict';

    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function () {

        // ========================================
        // CHECKBOX TOGGLE HANDLERS
        // ========================================

        // Sequential numbering toggle
        var enableSequential = document.getElementById('enable-sequential');
        var sequentialControls = document.getElementById('sequential-controls');
        if (enableSequential && sequentialControls) {
            enableSequential.addEventListener('change', function () {
                sequentialControls.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Find & replace toggle
        var enableFindReplace = document.getElementById('enable-find-replace');
        var findReplaceControls = document.getElementById('find-replace-controls');
        if (enableFindReplace && findReplaceControls) {
            enableFindReplace.addEventListener('change', function () {
                findReplaceControls.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Prefix/suffix toggle
        var enablePrefixSuffix = document.getElementById('enable-prefix-suffix');
        var prefixSuffixControls = document.getElementById('prefix-suffix-controls');
        if (enablePrefixSuffix && prefixSuffixControls) {
            enablePrefixSuffix.addEventListener('change', function () {
                prefixSuffixControls.style.display = this.checked ? 'block' : 'none';
            });
        }

        // ========================================
        // PREVIEW MODAL HANDLERS
        // ========================================

        var previewModal = document.getElementById('preview-modal');
        var closePreviewBtn = document.getElementById('close-preview');
        var cancelPreviewBtn = document.getElementById('cancel-preview');
        var applyPreviewBtn = document.getElementById('apply-preview');
        var previewList = document.getElementById('preview-list');
        var previewCount = document.getElementById('preview-count');
        var currentPreviews = [];

        // Close preview modal
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', function () {
                previewModal.style.display = 'none';
            });
        }

        if (cancelPreviewBtn) {
            cancelPreviewBtn.addEventListener('click', function () {
                previewModal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        if (previewModal) {
            previewModal.addEventListener('click', function (e) {
                if (e.target === previewModal) {
                    previewModal.style.display = 'none';
                }
            });
        }

        // ========================================
        // PREVIEW BUTTON HANDLER
        // ========================================

        var previewBtn = document.getElementById('preview-rename-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', function () {
                var options = collectRenameOptions();
                parent.postMessage({
                    pluginMessage: {
                        type: 'preview-rename',
                        options: options
                    }
                }, '*');
            });
        }

        // ========================================
        // APPLY BUTTON HANDLER
        // ========================================

        var applyBtn = document.getElementById('apply-rename-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                var options = collectRenameOptions();
                parent.postMessage({
                    pluginMessage: {
                        type: 'preview-rename',
                        options: options
                    }
                }, '*');
            });
        }

        // ========================================
        // APPLY PREVIEW HANDLER
        // ========================================

        if (applyPreviewBtn) {
            applyPreviewBtn.addEventListener('click', function () {
                if (currentPreviews.length > 0) {
                    parent.postMessage({
                        pluginMessage: {
                            type: 'apply-preview',
                            changes: currentPreviews
                        }
                    }, '*');
                    previewModal.style.display = 'none';
                }
            });
        }

        // ========================================
        // PRESET BUTTON HANDLERS
        // ========================================

        var presetBtns = document.querySelectorAll('.preset-btn');
        for (var i = 0; i < presetBtns.length; i++) {
            presetBtns[i].addEventListener('click', function () {
                var preset = this.getAttribute('data-preset');
                parent.postMessage({
                    pluginMessage: {
                        type: 'apply-preset',
                        preset: preset
                    }
                }, '*');
            });
        }

        // ========================================
        // MESSAGE HANDLER - PREVIEW RESPONSE
        // ========================================

        window.addEventListener('message', function (event) {
            var msg = event.data.pluginMessage;
            if (!msg) return;

            if (msg.type === 'rename-preview') {
                if (msg.error) {
                    alert(msg.error);
                    return;
                }

                currentPreviews = msg.previews;

                // Populate preview list
                previewList.innerHTML = '';
                if (msg.previews.length === 0) {
                    previewList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No changes to preview</p>';
                } else {
                    for (var i = 0; i < msg.previews.length; i++) {
                        var preview = msg.previews[i];
                        var item = document.createElement('div');
                        item.style.cssText = 'padding: 8px 12px; margin-bottom: 6px; background: var(--bg-tertiary); border-radius: 4px; border-left: 3px solid var(--accent-primary);';
                        item.innerHTML = '<div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 4px;">' + preview.oldName + '</div>' +
                            '<div style="font-size: 11px; color: var(--accent-primary); font-weight: 600;">→ ' + preview.newName + '</div>';
                        previewList.appendChild(item);
                    }
                }

                // Update count
                previewCount.textContent = msg.previews.length;

                // Show modal
                previewModal.style.display = 'flex';
            }
        });

        // ========================================
        // HELPER FUNCTION - COLLECT OPTIONS
        // ========================================

        function collectRenameOptions() {
            var options = {
                convention: document.getElementById('convention-select') ? document.getElementById('convention-select').value : 'semantic',
                casing: document.getElementById('casing-select') ? document.getElementById('casing-select').value : 'kebab',
                filters: {}
            };

            // Sequential numbering
            if (enableSequential && enableSequential.checked) {
                options.sequential = {
                    enabled: true,
                    start: parseInt(document.getElementById('seq-start').value) || 1,
                    padding: parseInt(document.getElementById('seq-padding').value) || 2,
                    position: document.getElementById('seq-position').value || 'suffix'
                };
            }

            // Find & replace
            if (enableFindReplace && enableFindReplace.checked) {
                var findText = document.getElementById('find-text').value;
                if (findText) {
                    options.findReplace = {
                        enabled: true,
                        find: findText,
                        replace: document.getElementById('replace-text').value || '',
                        caseSensitive: document.getElementById('case-sensitive').checked
                    };
                }
            }

            // Prefix/suffix
            if (enablePrefixSuffix && enablePrefixSuffix.checked) {
                var prefix = document.getElementById('prefix-text').value;
                var suffix = document.getElementById('suffix-text').value;
                if (prefix || suffix) {
                    options.prefixSuffix = {
                        enabled: true,
                        prefix: prefix || '',
                        suffix: suffix || ''
                    };
                }
            }

            return options;
        }
    });
})();
