import type { StateCreator } from 'zustand';
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    MarkerType,
} from 'reactflow';
import type {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from 'reactflow';
import type { WorkflowState } from '../useWorkflowStore';
import { getLayoutedElements } from '../layoutUtils';
import type { LayoutDirection } from '../layoutUtils';
import type { ProcessResponse, Activity, NodeConfiguration, NodeType } from '../../types/workflow';

export interface GraphSlice {
    nodes: Node[];
    edges: Edge[];
    layoutDirection: LayoutDirection;
    currentProcess: ProcessResponse | null;
    processMetadata: { name: string; description: string } | null;
    selectedEdgeId: string | null;

    setProcess: (process: ProcessResponse) => void;
    setGraph: (nodes: Node[], edges: Edge[]) => void;
    setLayoutDirection: (direction: LayoutDirection) => void;
    refreshLayout: (process: ProcessResponse) => void;
    updateNodeConfiguration: (nodeId: string, newConfig: Partial<NodeConfiguration>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applySuggestion: (suggestion: any, sourceNodeId: string) => void;
    setSelectedEdgeId: (id: string | null) => void;
    updateEdgeLabel: (edgeId: string, label: string) => void;
    setProcessMetadata: (name: string, description: string) => void;

    // ReactFlow Actions
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
    resetGraph: () => void;
}

// Layout calculation helper (Simplified for Slice)
const calculateLayout = (process: ProcessResponse, direction: LayoutDirection) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    process.swimlanes.forEach((lane) => {
        initialNodes.push({
            id: lane.swimlaneId,
            type: 'SWIMLANE',
            data: { label: lane.name, layoutDirection: direction },
            position: { x: 0, y: 0 },
            selectable: false,
            zIndex: -1,
        });
    });

    const activityNodes: Node[] = [];
    process.activities.forEach((activity) => {
        let typeStr = activity.type;
        if (!typeStr) {
            const configType = activity.configuration?.configType?.toUpperCase() || '';
            if (configType.includes('GATEWAY')) typeStr = 'EXCLUSIVE_GATEWAY';
            else if (configType.includes('EMAIL') || configType.includes('SERVICE')) typeStr = 'SERVICE_TASK';
            else typeStr = 'USER_TASK';
        }
        const normalizedType = typeStr.toUpperCase() as NodeType;

        activityNodes.push({
            id: activity.id,
            type: normalizedType,
            data: { ...activity, type: normalizedType, layoutDirection: direction },
            position: { x: 0, y: 0 },
        });

        if (activity.nextActivityId && activity.nextActivityId !== 'node_end') {
            initialEdges.push({
                id: `e-${activity.id}-${activity.nextActivityId}`,
                source: activity.id,
                target: activity.nextActivityId,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
            });
        }

        if (normalizedType === 'EXCLUSIVE_GATEWAY' && activity.configuration?.conditions) {
            activity.configuration.conditions.forEach((cond, idx) => {
                if (cond.targetActivityId && cond.targetActivityId !== 'node_end') {
                    initialEdges.push({
                        id: `e-${activity.id}-${cond.targetActivityId}-${idx}`,
                        source: activity.id,
                        target: cond.targetActivityId,
                        type: 'smoothstep',
                        label: cond.expression,
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { stroke: '#f59e0b', strokeWidth: 2 },
                    });
                }
            });
        }
    });
    initialNodes.push(...activityNodes);

    if (activityNodes.length > 0) {
        const startNodeId = 'node_start';
        // Simple heuristic: connect start to the first activity found
        const firstActivity = activityNodes[0];
        initialNodes.push({
            id: startNodeId,
            type: 'START',
            data: { label: 'Start', swimlaneId: firstActivity.data.swimlaneId, layoutDirection: direction },
            position: { x: 0, y: 0 },
        });

        initialEdges.push({
            id: `e-start-${firstActivity.id}`,
            source: startNodeId,
            target: firstActivity.id,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
        });
    }

    return getLayoutedElements(initialNodes, initialEdges, process.swimlanes, direction);
};

export const createGraphSlice: StateCreator<WorkflowState, [], [], GraphSlice> = (set, get) => ({
    nodes: [],
    edges: [],
    layoutDirection: 'LR',
    currentProcess: null,
    processMetadata: null,
    selectedEdgeId: null,

    setProcess: (process) => {
        const direction = get().layoutDirection;
        const { nodes, edges } = calculateLayout(process, direction);
        set({
            currentProcess: process,
            nodes,
            edges,
            processMetadata: {
                name: process.processName,
                description: process.description
            }
        });
    },

    setGraph: (newNodes, newEdges) => {
        const { layoutDirection, currentProcess } = get();
        if (!currentProcess) return;

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            newNodes,
            newEdges,
            currentProcess.swimlanes,
            layoutDirection
        );
        set({ nodes: layoutedNodes, edges: layoutedEdges });
    },

    setLayoutDirection: (direction) => {
        const currentProcess = get().currentProcess;
        if (currentProcess) {
            const { nodes, edges } = calculateLayout(currentProcess, direction);
            set({ layoutDirection: direction, nodes, edges });
        } else {
            set({ layoutDirection: direction });
        }
    },

    refreshLayout: (process) => get().setProcess(process),

    updateNodeConfiguration: (nodeId, newConfig) => {
        const { nodes, currentProcess } = get();
        const updatedNodes = nodes.map(node => {
            if (node.id === nodeId) {
                const currentData = node.data;
                const updatedConfig = { ...currentData.configuration, ...newConfig };
                return { ...node, data: { ...currentData, configuration: updatedConfig } };
            }
            return node;
        });

        let updatedProcess = currentProcess;
        if (currentProcess) {
            const updatedActivities = currentProcess.activities.map(activity => {
                if (activity.id === nodeId) {
                    return { ...activity, configuration: { ...activity.configuration, ...newConfig } };
                }
                return activity;
            });
            updatedProcess = { ...currentProcess, activities: updatedActivities };
        }
        set({ nodes: updatedNodes, currentProcess: updatedProcess });
    },

    applySuggestion: (suggestion, sourceNodeId) => {
        const { nodes, layoutDirection, currentProcess } = get();
        const newId = `node_${Date.now()}`;
        const sourceNode = nodes.find(n => n.id === sourceNodeId);
        const sourceSwimlaneId = sourceNode ? (sourceNode.data as Activity).swimlaneId : undefined;

        const newNodeData: Activity = {
            id: newId,
            type: suggestion.type,
            label: suggestion.title,
            description: suggestion.reason,
            configuration: suggestion.configuration,
            inputMapping: suggestion.inputMapping,
            swimlaneId: sourceSwimlaneId,
            layoutDirection: layoutDirection,
            nextActivityId: undefined,
            position: { x: 0, y: 0 }
        };

        if (currentProcess) {
            const updatedActivities = [...currentProcess.activities, newNodeData];
            const updatedActivitiesWithLink = updatedActivities.map(activity => {
                if (activity.id === sourceNodeId) {
                    return { ...activity, nextActivityId: newId };
                }
                return activity;
            });
            const updatedProcess = { ...currentProcess, activities: updatedActivitiesWithLink };
            get().setProcess(updatedProcess);
        }
    },

    setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

    updateEdgeLabel: (edgeId, label) => {
        const { edges, nodes } = get();
        const updatedEdges = edges.map(edge => edge.id === edgeId ? { ...edge, label: label || undefined } : edge);

        const targetEdge = edges.find(e => e.id === edgeId);
        if (targetEdge) {
            const sourceNode = nodes.find(n => n.id === targetEdge.source);
            if (sourceNode && (sourceNode.type === 'EXCLUSIVE_GATEWAY' || sourceNode.data.type === 'EXCLUSIVE_GATEWAY')) {
                const currentConfig = sourceNode.data.configuration || {};
                const currentConditions = currentConfig.conditions || [];
                const targetActivityId = targetEdge.target;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existingCondIndex = currentConditions.findIndex((c: any) => c.targetActivityId === targetActivityId);

                const newConditions = [...currentConditions];
                if (existingCondIndex >= 0) {
                    newConditions[existingCondIndex] = { ...newConditions[existingCondIndex], expression: label };
                } else {
                    newConditions.push({ expression: label, targetActivityId });
                }
                get().updateNodeConfiguration(sourceNode.id, { conditions: newConditions });
            }
        }
        set({ edges: updatedEdges });
    },

    setProcessMetadata: (name, description) => set({ processMetadata: { name, description } }),

    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
    onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
    addNode: (node) => set({ nodes: [...get().nodes, node] }),

    resetGraph: () => set({
        nodes: [], edges: [], currentProcess: null, processMetadata: null, selectedEdgeId: null
    }),
});