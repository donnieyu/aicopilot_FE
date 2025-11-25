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

import type { ProcessResponse, NodeType } from '../types/workflow';
import { getLayoutedElements } from './layoutUtils';
import type { LayoutDirection } from './layoutUtils'; // [Fix] 타입 import 분리

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    processMetadata: { name: string; description: string } | null;
    layoutDirection: LayoutDirection;
    currentProcess: ProcessResponse | null;

    // Actions
    setProcess: (process: ProcessResponse) => void;
    setLayoutDirection: (direction: LayoutDirection) => void;

    // [Fix] 인터페이스에 refreshLayout 추가 (에러 해결)
    refreshLayout: (process: ProcessResponse) => void;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    nodes: [],
    edges: [],
    processMetadata: null,
    layoutDirection: 'LR', // 기본값: 좌우
    currentProcess: null,

    setProcess: (process: ProcessResponse) => {
        // 원본 데이터 저장
        set({ currentProcess: process });

        // 현재 레이아웃 설정으로 그래프 생성
        get().refreshLayout(process);
    },

    // 레이아웃 방향 변경
    setLayoutDirection: (direction: LayoutDirection) => {
        set({ layoutDirection: direction });
        const currentProcess = get().currentProcess;
        if (currentProcess) {
            get().refreshLayout(currentProcess);
        }
    },

    // 내부 헬퍼: 레이아웃 재계산
    refreshLayout: (process: ProcessResponse) => {
        const direction = get().layoutDirection;

        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];

        // [1] Swimlane Node 생성
        process.swimlanes.forEach((lane) => {
            initialNodes.push({
                id: lane.swimlaneId,
                type: 'SWIMLANE',
                data: { label: lane.name },
                position: { x: 0, y: 0 },
                selectable: false,
            });
        });

        // [2] Activity Node 생성
        const activityNodes: Node[] = [];
        process.activities.forEach((activity) => {
            const normalizedType = activity.type.toUpperCase() as NodeType;

            activityNodes.push({
                id: activity.id,
                type: normalizedType,
                data: { ...activity, type: normalizedType },
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

        // [3] Start Node
        if (activityNodes.length > 0) {
            const targetIds = new Set(initialEdges.map(e => e.target));
            const firstActivity = activityNodes.find(n => !targetIds.has(n.id)) || activityNodes[0];
            const startNodeId = 'node_start';

            initialNodes.push({
                id: startNodeId,
                type: 'START',
                data: { label: 'Start', swimlaneId: firstActivity.data.swimlaneId },
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

        // [4] End Node
        const endNodeId = 'node_end_point';
        const explicitEndConnectors = process.activities.filter(a => a.nextActivityId === 'node_end' && a.type.toUpperCase() !== 'EXCLUSIVE_GATEWAY');
        const gatewayConditionEndConnectors = process.activities.filter(a => a.type.toUpperCase() === 'EXCLUSIVE_GATEWAY' && a.configuration?.conditions?.some(c => c.targetActivityId === 'node_end'));

        if (explicitEndConnectors.length > 0 || gatewayConditionEndConnectors.length > 0) {
            const lastConnector = explicitEndConnectors[0] || gatewayConditionEndConnectors[0];
            initialNodes.push({
                id: endNodeId,
                type: 'END',
                data: { label: 'End', swimlaneId: lastConnector?.swimlaneId },
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

        // [5] 레이아웃 적용 (direction 전달)
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges,
            process.swimlanes,
            direction
        );

        set({
            nodes: layoutedNodes,
            edges: layoutedEdges,
            processMetadata: {
                name: process.processName,
                description: process.description,
            },
        });
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