import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
} from 'reactflow';
import type {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from 'reactflow';

import type { ProcessResponse, NodeType, NodeSuggestion, Activity } from '../types/workflow'; // [Check] Activity 확인
import { getLayoutedElements } from './layoutUtils';
import type { LayoutDirection } from './layoutUtils';

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    processMetadata: { name: string; description: string } | null;
    layoutDirection: LayoutDirection;
    currentProcess: ProcessResponse | null;

    // Actions
    setProcess: (process: ProcessResponse) => void;
    setLayoutDirection: (direction: LayoutDirection) => void;

    refreshLayout: (process: ProcessResponse) => void;

    applySuggestion: (suggestion: NodeSuggestion, sourceNodeId: string) => void;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
}

// [Helper] ... (calculateLayout 함수는 그대로 유지)
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
        });
    });

    const activityNodes: Node[] = [];
    process.activities.forEach((activity) => {
        const normalizedType = activity.type.toUpperCase() as NodeType;

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

        if (normalizedType === 'EXCLUSIVE_GATEWAY' && activity.configuration.conditions) {
            activity.configuration.conditions.forEach((cond) => {
                if (cond.targetActivityId && cond.targetActivityId !== 'node_end') {
                    initialEdges.push({
                        id: `e-${activity.id}-${cond.targetActivityId}`,
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
        const targetIds = new Set(initialEdges.map(e => e.target));
        const firstActivity = activityNodes.find(n => !targetIds.has(n.id)) || activityNodes[0];
        const startNodeId = 'node_start';

        initialNodes.push({
            id: startNodeId,
            type: 'START',
            data: {
                label: 'Start',
                swimlaneId: firstActivity.data.swimlaneId,
                layoutDirection: direction
            },
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

    const endNodeId = 'node_end_point';
    const explicitEndConnectors = process.activities.filter(a => a.nextActivityId === 'node_end' && a.type.toUpperCase() !== 'EXCLUSIVE_GATEWAY');
    const gatewayConditionEndConnectors = process.activities.filter(a => a.type.toUpperCase() === 'EXCLUSIVE_GATEWAY' && a.configuration?.conditions?.some(c => c.targetActivityId === 'node_end'));

    if (explicitEndConnectors.length > 0 || gatewayConditionEndConnectors.length > 0) {
        const lastConnector = explicitEndConnectors[0] || gatewayConditionEndConnectors[0];
        initialNodes.push({
            id: endNodeId,
            type: 'END',
            data: {
                label: 'End',
                swimlaneId: lastConnector?.swimlaneId,
                layoutDirection: direction
            },
            position: { x: 0, y: 0 },
        });

        explicitEndConnectors.forEach(sourceNode => {
            initialEdges.push({
                id: `e-${sourceNode.id}-${endNodeId}`,
                source: sourceNode.id,
                target: endNodeId,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
            });
        });

        gatewayConditionEndConnectors.forEach(gateway => {
            gateway.configuration.conditions?.forEach(cond => {
                if (cond.targetActivityId === 'node_end') {
                    initialEdges.push({
                        id: `e-${gateway.id}-${endNodeId}`,
                        source: gateway.id,
                        target: endNodeId,
                        type: 'smoothstep',
                        label: cond.expression,
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { stroke: '#f59e0b', strokeWidth: 2 },
                    });
                }
            });
        });
    }

    return getLayoutedElements(
        initialNodes,
        initialEdges,
        process.swimlanes,
        direction
    );
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    nodes: [],
    edges: [],
    processMetadata: null,
    layoutDirection: 'LR',
    currentProcess: null,

    setProcess: (process: ProcessResponse) => {
        const direction = get().layoutDirection;
        const { nodes, edges } = calculateLayout(process, direction);

        set({
            currentProcess: process,
            nodes,
            edges,
            processMetadata: {
                name: process.processName,
                description: process.description,
            },
        });
    },

    setLayoutDirection: (direction: LayoutDirection) => {
        const currentProcess = get().currentProcess;
        if (currentProcess) {
            const { nodes, edges } = calculateLayout(currentProcess, direction);
            set({
                layoutDirection: direction,
                nodes,
                edges
            });
        } else {
            set({ layoutDirection: direction });
        }
    },

    refreshLayout: (process: ProcessResponse) => {
        get().setProcess(process);
    },

    applySuggestion: (suggestion: NodeSuggestion, sourceNodeId: string) => {
        const { nodes, layoutDirection } = get();

        const newId = `node_${Date.now()}`;

        // [Fix] any 타입 제거 및 안전한 접근
        // 1. 소스 노드 찾기
        const sourceNode = nodes.find(n => n.id === sourceNodeId);

        // 2. 소스 노드의 data에서 swimlaneId 추출 (Activity 타입으로 단언)
        // Node의 data는 제네릭이지만, 우리가 Activity 타입을 넣었으므로 단언 가능
        const sourceSwimlaneId = sourceNode ? (sourceNode.data as Activity).swimlaneId : undefined;

        // 3. Activity 타입으로 새 노드 데이터 생성
        const newNodeData: Activity = {
            id: newId,
            type: suggestion.type,
            label: suggestion.title,
            description: suggestion.reason,
            configuration: suggestion.configuration,
            inputMapping: suggestion.inputMapping,
            swimlaneId: sourceSwimlaneId, // 추출한 ID 사용
            layoutDirection: layoutDirection,
            // Activity 인터페이스의 필수 필드들 (필요시 기본값 추가)
            nextActivityId: undefined,
            position: undefined
        };

        const currentProcess = get().currentProcess;
        if (currentProcess) {
            const updatedActivities = [
                ...currentProcess.activities,
                newNodeData
            ];

            const updatedActivitiesWithLink = updatedActivities.map(activity => {
                if (activity.id === sourceNodeId) {
                    return { ...activity, nextActivityId: newId };
                }
                return activity;
            });

            const updatedProcess = {
                ...currentProcess,
                activities: updatedActivitiesWithLink
            };

            get().setProcess(updatedProcess);
        }
    },

    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },
    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) });
    },
    addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
    },
}));