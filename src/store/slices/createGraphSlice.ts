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
import { getElkLayoutedElements } from '../../utils/elkLayoutUtils';
import type { LayoutDirection } from '../../utils/elkLayoutUtils';
import type { ProcessResponse, NodeConfiguration, NodeType } from '../../types/workflow';
import type { ReactNode } from 'react';

export interface GraphSlice {
    nodes: Node[];
    edges: Edge[];
    layoutDirection: LayoutDirection;
    currentProcess: ProcessResponse | null;
    processMetadata: { name: string; description: string } | null;
    selectedEdgeId: string | null;

    setProcess: (process: ProcessResponse) => Promise<void>;
    setGraph: (nodes: Node[], edges: Edge[]) => void;
    setLayoutDirection: (direction: LayoutDirection) => Promise<void>;
    refreshLayout: () => Promise<void>;

    updateNodeConfiguration: (nodeId: string, newConfig: Partial<NodeConfiguration>) => void;
    insertNode: (edgeId: string, type: NodeType) => Promise<void>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applySuggestion: () => void;
    setSelectedEdgeId: (id: string | null) => void;
    updateEdgeLabel: () => void;
    setProcessMetadata: (name: string, description: string) => void;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
    resetGraph: () => void;
}

// 엣지 생성 헬퍼
const createEdge = (source: string, target: string, label?: string | ReactNode): Edge => ({
    id: `e-${source}-${target}-${Date.now()}`,
    source,
    target,
    label,
    type: 'PLUS_EDGE',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1.5 }
});

export const createGraphSlice: StateCreator<WorkflowState, [], [], GraphSlice> = (set, get) => ({
    nodes: [],
    edges: [],
    layoutDirection: 'LR',
    currentProcess: null,
    processMetadata: null,
    selectedEdgeId: null,

    setProcess: async (process) => {
        const direction = get().layoutDirection;
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];

        let hasEndConnection = false;
        let lastSwimlaneId: string | undefined = undefined;

        process.activities.forEach((activity) => {
            let typeStr = activity.type;
            if (!typeStr) {
                const configType = activity.configuration?.configType?.toUpperCase() || '';
                if (configType.includes('GATEWAY')) typeStr = 'EXCLUSIVE_GATEWAY';
                else if (configType.includes('EMAIL') || configType.includes('SERVICE')) typeStr = 'SERVICE_TASK';
                else typeStr = 'USER_TASK';
            }
            const normalizedType = typeStr.toUpperCase() as NodeType;

            initialNodes.push({
                id: activity.id,
                type: normalizedType,
                data: { ...activity, type: normalizedType, layoutDirection: direction },
                position: { x: 0, y: 0 },
            });

            if (activity.swimlaneId) lastSwimlaneId = activity.swimlaneId;

            if (activity.nextActivityId) {
                if (activity.nextActivityId === 'node_end') {
                    hasEndConnection = true;
                    if (activity.swimlaneId) lastSwimlaneId = activity.swimlaneId;
                    initialEdges.push(createEdge(activity.id, 'node_end'));
                } else {
                    initialEdges.push(createEdge(activity.id, activity.nextActivityId));
                }
            }

            if (normalizedType === 'EXCLUSIVE_GATEWAY' && activity.configuration?.conditions) {
                activity.configuration.conditions.forEach((cond) => {
                    if (cond.targetActivityId) {
                        if (cond.targetActivityId === 'node_end') {
                            hasEndConnection = true;
                            if (activity.swimlaneId) lastSwimlaneId = activity.swimlaneId;
                            initialEdges.push(createEdge(activity.id, 'node_end', cond.expression));
                        } else {
                            initialEdges.push(createEdge(activity.id, cond.targetActivityId, cond.expression));
                        }
                    }
                });
            }
        });

        if (initialNodes.length > 0) {
            const startId = 'node_start';
            const firstNode = initialNodes[0];
            const startSwimlaneId = firstNode.data.swimlaneId;

            initialNodes.push({
                id: startId,
                type: 'START',
                data: { label: 'Start', swimlaneId: startSwimlaneId },
                position: { x: 0, y: 0 }
            });
            initialEdges.push(createEdge(startId, firstNode.id));
        }

        if (hasEndConnection) {
            const endId = 'node_end';
            const endExists = initialNodes.some(n => n.id === endId);

            if (!endExists) {
                initialNodes.push({
                    id: endId,
                    type: 'END',
                    data: { label: 'End', swimlaneId: lastSwimlaneId },
                    position: { x: 0, y: 0 }
                });
            }
        }

        const { nodes: layoutedNodes, edges: layoutedEdges } = await getElkLayoutedElements(
            initialNodes,
            initialEdges,
            process.swimlanes,
            direction
        );

        set({
            currentProcess: process,
            nodes: layoutedNodes,
            edges: layoutedEdges,
            processMetadata: {
                name: process.processName,
                description: process.description
            }
        });
    },

    setGraph: (newNodes, newEdges) => {
        set({ nodes: newNodes, edges: newEdges });
    },

    setLayoutDirection: async (direction) => {
        set({ layoutDirection: direction });
        await get().refreshLayout();
    },

    refreshLayout: async () => {
        const { nodes, edges, layoutDirection, currentProcess } = get();
        if (!currentProcess) return;

        // ELK Layout 재실행
        const { nodes: layoutedNodes, edges: layoutedEdges } = await getElkLayoutedElements(
            nodes,
            edges,
            currentProcess.swimlanes,
            layoutDirection
        );
        set({ nodes: layoutedNodes, edges: layoutedEdges });
    },

    insertNode: async (edgeId, type) => {
        const { nodes, edges } = get();
        const targetEdge = edges.find(e => e.id === edgeId);

        if (!targetEdge) return;

        const sourceNode = nodes.find(n => n.id === targetEdge.source);
        const targetNode = nodes.find(n => n.id === targetEdge.target);

        if (!sourceNode) return;

        // 1. Create New Node
        const newNodeId = `node_${Date.now()}`;
        const swimlaneId = sourceNode.data.swimlaneId; // Inherit swimlane

        // [Smart Position] 초기 위치를 Source와 Target의 중간으로 설정하여 애니메이션 효과 증대
        const initialX = targetNode ? (sourceNode.position.x + targetNode.position.x) / 2 : sourceNode.position.x + 200;
        const initialY = targetNode ? (sourceNode.position.y + targetNode.position.y) / 2 : sourceNode.position.y;

        const newNode: Node = {
            id: newNodeId,
            type: type,
            data: {
                id: newNodeId,
                label: 'New Step',
                type: type,
                swimlaneId: swimlaneId,
                description: 'Newly inserted step',
                configuration: {
                    configType: type === 'EXCLUSIVE_GATEWAY' ? 'GATEWAY_CONFIG' : 'USER_TASK_CONFIG'
                }
            },
            position: { x: initialX, y: initialY }
        };

        // 2. Create New Edges
        // label은 ReactNode일 수도 있으므로, string만 추출하거나 그대로 전달 (createEdge가 처리)
        const edge1 = createEdge(targetEdge.source, newNodeId, targetEdge.label);
        const edge2 = createEdge(newNodeId, targetEdge.target);

        // 3. Update State (Insert Node & Replace Edge)
        const newNodes = [...nodes, newNode];
        const newEdges = edges.filter(e => e.id !== edgeId).concat([edge1, edge2]);

        set({ nodes: newNodes, edges: newEdges });

        // 4. Trigger Auto Layout (ELK)
        // 레이아웃이 다시 계산되면서 노드들이 자연스럽게 밀려남
        await get().refreshLayout();
    },

    updateNodeConfiguration: (nodeId, newConfig) => {
        const { nodes } = get();
        const updatedNodes = nodes.map(node =>
            node.id === nodeId
                ? { ...node, data: { ...node.data, configuration: { ...node.data.configuration, ...newConfig } } }
                : node
        );
        set({ nodes: updatedNodes });
    },

    applySuggestion: () => {},
    setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
    updateEdgeLabel: () => {},
    setProcessMetadata: (name, description) => set({ processMetadata: { name, description } }),

    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
    onConnect: (connection) => set({ edges: addEdge({ ...connection, type: 'PLUS_EDGE' }, get().edges) }),
    addNode: (node) => set({ nodes: [...get().nodes, node] }),

    resetGraph: () => set({
        nodes: [], edges: [], currentProcess: null, processMetadata: null, selectedEdgeId: null
    }),
});