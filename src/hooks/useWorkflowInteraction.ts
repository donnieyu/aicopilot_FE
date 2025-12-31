import { useState, useCallback } from 'react';
import type { MouseEvent } from 'react';
import type { Node } from 'reactflow';
import { useWorkflowStore } from '../store/useWorkflowStore';

export function useWorkflowInteraction() {
    // Global Store State & Actions
    const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
    const selectNode = useWorkflowStore((state) => state.selectNode);
    const viewMode = useWorkflowStore((state) => state.viewMode);
    const setViewMode = useWorkflowStore((state) => state.setViewMode);
    const assetUrl = useWorkflowStore((state) => state.assetUrl);

    // Local UI State
    const [isInspectorOpen, setInspectorOpen] = useState(false);
    const [isSideOutlinerOpen, setSideOutlinerOpen] = useState(false);

    // [Changed] 오른쪽 패널의 초기 상태를 닫힘(false)으로 변경
    const [isRightPanelOpen, setRightPanelOpen] = useState(false);

    // --- Handlers ---

    // 1. Node Click Handler
    const handleNodeClick = useCallback((_: MouseEvent, node: Node) => {
        if (selectedNodeId === node.id) return;

        selectNode(node.id);

        // 노드를 클릭하면 패널이 닫혀있을 경우 자동으로 엽니다.
        if (!isRightPanelOpen) {
            setRightPanelOpen(true);
        }
    }, [selectedNodeId, isRightPanelOpen, selectNode]);

    // 2. Canvas Background Click Handler
    const handlePaneClick = useCallback(() => {
        selectNode(null);
    }, [selectNode]);

    // 3. View Mode Toggle Handler
    const toggleViewMode = useCallback(() => {
        setViewMode(viewMode === 'DEFAULT' ? 'VERIFICATION' : 'DEFAULT');
    }, [viewMode, setViewMode]);

    return {
        // State
        selectedNodeId,
        viewMode,
        assetUrl,
        isInspectorOpen,
        isSideOutlinerOpen,
        isRightPanelOpen,

        // Setters
        setInspectorOpen,
        setSideOutlinerOpen,
        setRightPanelOpen,

        // Handlers
        handleNodeClick,
        handlePaneClick,
        toggleViewMode
    };
}