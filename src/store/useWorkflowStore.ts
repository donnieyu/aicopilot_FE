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

import type { ProcessResponse, NodeType, NodeSuggestion, Activity, NodeConfiguration, DataEntity } from '../types/workflow';
import { getLayoutedElements } from './layoutUtils';
import type { LayoutDirection } from './layoutUtils';
import { getUpstreamNodeIds } from '../utils/graphUtils'; // [New] Graph Utils Import

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    processMetadata: { name: string; description: string } | null;
    layoutDirection: LayoutDirection;
    currentProcess: ProcessResponse | null;

    // [New] 데이터 엔티티 저장소 (Global Variable Pool)
    dataEntities: DataEntity[];

    // Actions
    setProcess: (process: ProcessResponse) => void;

    // [New] 데이터 엔티티 설정 액션
    setDataEntities: (entities: DataEntity[]) => void;

    setLayoutDirection: (direction: LayoutDirection) => void;
    refreshLayout: (process: ProcessResponse) => void;
    applySuggestion: (suggestion: NodeSuggestion, sourceNodeId: string) => void;

    // [New] 노드 설정 업데이트 액션
    updateNodeConfiguration: (nodeId: string, newConfig: Partial<NodeConfiguration>) => void;

    // [New] 특정 노드 시점에서 사용 가능한 변수 조회 (Smart Binding 핵심)
    getAvailableVariables: (nodeId: string) => DataEntity[];

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
}

// [Helper] 프로세스 데이터를 기반으로 노드/엣지 생성 및 레이아웃 계산 함수
const calculateLayout = (process: ProcessResponse, direction: LayoutDirection) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // [1] Swimlane Node 생성
    process.swimlanes.forEach((lane) => {
        initialNodes.push({
            id: lane.swimlaneId,
            type: 'SWIMLANE',
            data: { label: lane.name, layoutDirection: direction },
            position: { x: 0, y: 0 },
            selectable: false,
        });
    });

    // [2] Activity Node 생성
    const activityNodes: Node[] = [];
    process.activities.forEach((activity) => {
        let typeStr = activity.type;

        if (!typeStr) {
            const configType = activity.configuration?.configType?.toUpperCase() || '';
            if (configType.includes('GATEWAY')) {
                typeStr = 'EXCLUSIVE_GATEWAY';
            } else if (configType.includes('EMAIL') || configType.includes('SERVICE')) {
                typeStr = 'SERVICE_TASK';
            } else {
                typeStr = 'USER_TASK';
            }
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

    // [4] End Node
    const endNodeId = 'node_end_point';
    const explicitEndConnectors = process.activities.filter(a =>
        (a.nextActivityId === 'node_end' || !a.nextActivityId) &&
        (a.type || 'USER_TASK').toUpperCase() !== 'EXCLUSIVE_GATEWAY'
    );

    const gatewayConditionEndConnectors = process.activities.filter(a => {
        const type = (a.type || (a.configuration?.configType?.includes('GATEWAY') ? 'EXCLUSIVE_GATEWAY' : 'USER_TASK')).toUpperCase();
        return type === 'EXCLUSIVE_GATEWAY' && a.configuration?.conditions?.some(c => c.targetActivityId === 'node_end');
    });

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

    // [5] 레이아웃 적용
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
    dataEntities: [], // [New] 초기값

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

    // [New] 데이터 엔티티 업데이트 구현
    setDataEntities: (entities: DataEntity[]) => {
        set({ dataEntities: entities });
    },

    // [New] Smart Binding 로직 구현
    getAvailableVariables: (nodeId: string) => {
        const { edges, dataEntities } = get();

        // 1. 현재 노드의 상위 노드 ID들을 모두 찾음 (Data Lineage)
        const upstreamNodeIds = getUpstreamNodeIds(nodeId, edges);

        // 2. 전체 변수 풀(dataEntities) 중에서, sourceNodeId가 상위 노드 목록에 있는 것만 필터링
        //    (즉, 이 시점에서 이미 생성되어 존재하는 데이터만 리턴)
        return dataEntities.filter(entity =>
            entity.sourceNodeId && upstreamNodeIds.has(entity.sourceNodeId)
        );
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

    // [New] 노드 설정 업데이트 구현
    updateNodeConfiguration: (nodeId: string, newConfig: Partial<NodeConfiguration>) => {
        const { nodes, currentProcess } = get();

        // 1. ReactFlow Nodes 상태 업데이트 (화면 갱신용)
        const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
                // 기존 data 구조를 유지하면서 configuration만 병합
                const currentData = node.data;
                const updatedConfig = { ...currentData.configuration, ...newConfig };

                return {
                    ...node,
                    data: {
                        ...currentData,
                        configuration: updatedConfig,
                    },
                };
            }
            return node;
        });

        // 2. ProcessResponse 상태 업데이트 (데이터 무결성 유지)
        let updatedProcess = currentProcess;
        if (currentProcess) {
            const updatedActivities = currentProcess.activities.map((activity) => {
                if (activity.id === nodeId) {
                    return {
                        ...activity,
                        configuration: { ...activity.configuration, ...newConfig },
                    };
                }
                return activity;
            });

            updatedProcess = {
                ...currentProcess,
                activities: updatedActivities,
            };
        }

        set({
            nodes: updatedNodes,
            currentProcess: updatedProcess,
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