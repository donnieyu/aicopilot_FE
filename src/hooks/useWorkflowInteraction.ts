import { useState, useCallback } from 'react';
import type { MouseEvent } from 'react';
import type { Node } from 'reactflow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { NodeSuggestion } from '../types/workflow';

export function useWorkflowInteraction() {
    // Global Store State & Actions
    const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
    const selectNode = useWorkflowStore((state) => state.selectNode);
    const viewMode = useWorkflowStore((state) => state.viewMode);
    const setViewMode = useWorkflowStore((state) => state.setViewMode);
    const assetUrl = useWorkflowStore((state) => state.assetUrl);
    const applySuggestion = useWorkflowStore((state) => state.applySuggestion);

    // Local UI State
    const [isInspectorOpen, setInspectorOpen] = useState(false);
    const [isSideOutlinerOpen, setSideOutlinerOpen] = useState(false);
    const [isRightPanelOpen, setRightPanelOpen] = useState(true);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
    const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);

    // --- Handlers ---

    // 1. Node Click Handler
    const handleNodeClick = useCallback((_: MouseEvent, node: Node) => {
        if (selectedNodeId === node.id) return;

        selectNode(node.id);
        setShowSuggestionPanel(false);
        setSuggestions([]);

        // If panel is closed, open it to show node config
        if (!isRightPanelOpen) {
            setRightPanelOpen(true);
        }
    }, [selectedNodeId, isRightPanelOpen, selectNode]);

    // 2. Canvas Background Click Handler
    const handlePaneClick = useCallback(() => {
        selectNode(null);
        setShowSuggestionPanel(false);
    }, [selectNode]);

    // 3. View Mode Toggle Handler
    const toggleViewMode = useCallback(() => {
        setViewMode(viewMode === 'DEFAULT' ? 'VERIFICATION' : 'DEFAULT');
    }, [viewMode, setViewMode]);

    // 4. Suggestion Application Handler
    const handleApplySuggestion = useCallback((suggestion: NodeSuggestion) => {
        if (selectedNodeId) {
            applySuggestion(suggestion, selectedNodeId);
            setShowSuggestionPanel(false);
            setSuggestions([]);
        }
    }, [selectedNodeId, applySuggestion]);

    return {
        // State
        selectedNodeId,
        viewMode,
        assetUrl,
        isInspectorOpen,
        isSideOutlinerOpen,
        isRightPanelOpen,
        showSuggestionPanel,
        suggestions,

        // Setters
        setInspectorOpen,
        setSideOutlinerOpen,
        setRightPanelOpen,
        setShowSuggestionPanel,
        setSuggestions,

        // Handlers
        handleNodeClick,
        handlePaneClick,
        toggleViewMode,
        handleApplySuggestion
    };
}