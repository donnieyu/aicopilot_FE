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

import type {
    ProcessResponse,
    NodeType,
    NodeSuggestion,
    Activity,
    NodeConfiguration,
    DataEntity,
    AnalysisResult,
    DataEntitiesGroup,
    FormDefinitions,
    // [New] Import
    SourceReference
} from '../types/workflow';
import { getLayoutedElements } from './layoutUtils';
import type { LayoutDirection } from './layoutUtils';
import { getUpstreamNodeIds } from '../utils/graphUtils';

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    processMetadata: { name: string; description: string } | null;
    layoutDirection: LayoutDirection;
    currentProcess: ProcessResponse | null;

    dataEntities: DataEntity[];
    dataGroups: DataEntitiesGroup[];
    formDefinitions: FormDefinitions[];

    analysisResults: Record<string, AnalysisResult[]>;
    selectedEdgeId: string | null;

    // [New] Asset & Traceability State
    viewMode: 'DEFAULT' | 'VERIFICATION';
    assetUrl: string | null; // 업로드된 원본 이미지 URL
    selectedNodeId: string | null; // ReactFlow에서 선택된 노드 ID (기존과 통합)
    selectedSourceRegion: SourceReference | null; // 문서 뷰어에서 선택된 영역

    // Actions
    setProcess: (process: ProcessResponse) => void;
    setGraph: (nodes: Node[], edges: Edge[]) => void;

    setDataModel: (entities: DataEntity[], groups: DataEntitiesGroup[]) => void;
    addDataEntity: (entity: DataEntity) => void;

    setFormDefinitions: (forms: FormDefinitions[]) => void;
    addFormDefinition: (form: FormDefinitions) => void;

    setLayoutDirection: (direction: LayoutDirection) => void;
    refreshLayout: (process: ProcessResponse) => void;
    applySuggestion: (suggestion: NodeSuggestion, sourceNodeId: string) => void;
    updateNodeConfiguration: (nodeId: string, newConfig: Partial<NodeConfiguration>) => void;
    getAvailableVariables: (nodeId: string) => DataEntity[];

    setSelectedEdgeId: (id: string | null) => void;
    updateEdgeLabel: (edgeId: string, label: string) => void;
    setAnalysisResults: (results: AnalysisResult[]) => void;
    clearAnalysisResults: () => void;

    // [New] Asset & Traceability Actions
    setViewMode: (mode: 'DEFAULT' | 'VERIFICATION') => void;
    setAssetUrl: (url: string | null) => void;
    selectNode: (nodeId: string | null) => void; // Node 선택 시 -> Source Highlight
    selectSourceRegion: (ref: SourceReference | null) => void; // Source 선택 시 -> Node Highlight
    setProcessMetadata: (name: string, description: string) => void;

    reset: () => void;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
}

// -----------------------------------------------------------------------------
// [Core Logic] 프로세스 데이터 -> ReactFlow 요소 변환 및 레이아웃 계산
// -----------------------------------------------------------------------------
const calculateLayout = (process: ProcessResponse, direction: LayoutDirection) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // 1. Swimlane Node 생성
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

    // 2. Activity Node 생성 및 Edge 연결
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
            data: {
                ...activity,
                type: normalizedType,
                layoutDirection: direction
            },
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

    // 3. Start Node 자동 생성 및 연결
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

    // 4. End Node 자동 생성 및 연결
    const endNodeId = 'node_end_point';

    // Gateway가 아니고, (명시적으로 node_end이거나 다음 단계가 없는 경우)만 End와 연결
    const explicitEndConnectors = process.activities.filter(a => {
        const type = (a.type || '').toUpperCase();
        const configType = (a.configuration?.configType || '').toUpperCase();
        const isGateway = type === 'EXCLUSIVE_GATEWAY' || configType.includes('GATEWAY');

        return !isGateway && (a.nextActivityId === 'node_end' || !a.nextActivityId);
    });

    const gatewayEndConnectors = process.activities.filter(a => {
        const type = (a.type || '').toUpperCase();
        const configType = (a.configuration?.configType || '').toUpperCase();
        const isGateway = type === 'EXCLUSIVE_GATEWAY' || configType.includes('GATEWAY');

        return isGateway && a.configuration?.conditions?.some(c => c.targetActivityId === 'node_end');
    });

    if (explicitEndConnectors.length > 0 || gatewayEndConnectors.length > 0) {
        const lastConnector = explicitEndConnectors[0] || gatewayEndConnectors[0];
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

        gatewayEndConnectors.forEach(gateway => {
            gateway.configuration?.conditions?.forEach((cond, idx) => {
                if (cond.targetActivityId === 'node_end') {
                    initialEdges.push({
                        id: `e-${gateway.id}-${endNodeId}-${idx}`,
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

    // 5. Layout Calculation (Dagre)
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
    dataEntities: [],
    dataGroups: [],
    formDefinitions: [],
    analysisResults: {},
    selectedEdgeId: null,

    // [New] Asset State Init
    viewMode: 'DEFAULT',
    assetUrl: null,
    selectedNodeId: null,
    selectedSourceRegion: null,

    setProcess: (process: ProcessResponse) => {
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

        // 1. Activity Nodes Filter
        const activityNodes = newNodes.filter(n =>
            ['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(n.type || '')
        );

        // 2. Reconstruct Infrastructure
        const infrastructureNodes: Node[] = [];

        currentProcess.swimlanes.forEach((lane) => {
            infrastructureNodes.push({
                id: lane.swimlaneId,
                type: 'SWIMLANE',
                data: { label: lane.name, layoutDirection },
                position: { x: 0, y: 0 },
                selectable: false,
                zIndex: -1,
            });
        });

        // 3. Start/End Reconstruct
        const existingStart = newNodes.find(n => n.type === 'START');
        if (existingStart) {
            infrastructureNodes.push({ ...existingStart, data: { ...existingStart.data, layoutDirection } });
        } else {
            infrastructureNodes.push({
                id: 'node_start',
                type: 'START',
                data: { label: 'Start', swimlaneId: currentProcess.swimlanes[0]?.swimlaneId, layoutDirection },
                position: { x: 0, y: 0 }
            });
        }

        const existingEnd = newNodes.find(n => n.type === 'END');
        if (existingEnd) {
            infrastructureNodes.push({ ...existingEnd, data: { ...existingEnd.data, layoutDirection } });
        } else {
            infrastructureNodes.push({
                id: 'node_end_point',
                type: 'END',
                data: { label: 'End', swimlaneId: currentProcess.swimlanes[currentProcess.swimlanes.length - 1]?.swimlaneId, layoutDirection },
                position: { x: 0, y: 0 }
            });
        }

        // 4. Combine & Layout
        const nodesToLayout = [...infrastructureNodes, ...activityNodes];
        nodesToLayout.forEach(n => {
            if (n.data) n.data.layoutDirection = layoutDirection;
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodesToLayout,
            newEdges,
            currentProcess.swimlanes,
            layoutDirection
        );

        set({ nodes: layoutedNodes, edges: layoutedEdges });
    },

    setDataModel: (entities, groups) => set({ dataEntities: entities, dataGroups: groups }),

    addDataEntity: (entity: DataEntity) => {
        const { dataEntities, dataGroups } = get();
        if (dataEntities.some(e => e.id === entity.id || e.alias === entity.alias)) return;

        const newEntities = [...dataEntities, entity];
        const targetGroupIndex = dataGroups.findIndex(g => g.id === 'group_user_defined');
        const newGroups = [...dataGroups];

        if (targetGroupIndex === -1) {
            const newGroup: DataEntitiesGroup = {
                id: 'group_user_defined',
                alias: 'UserDefined',
                name: 'User Defined Variables',
                description: 'Manually created variables.',
                entityIds: [entity.id]
            };
            newGroups.push(newGroup);
        } else {
            const targetGroup = { ...newGroups[targetGroupIndex] };
            targetGroup.entityIds = [...targetGroup.entityIds, entity.id];
            newGroups[targetGroupIndex] = targetGroup;
        }

        set({ dataEntities: newEntities, dataGroups: newGroups });
    },

    setFormDefinitions: (forms) => set({ formDefinitions: forms }),
    addFormDefinition: (form) => set((state) => ({ formDefinitions: [...state.formDefinitions, form] })),

    getAvailableVariables: (nodeId) => {
        const { edges, dataEntities } = get();
        const upstreamNodeIds = getUpstreamNodeIds(nodeId, edges);
        return dataEntities.filter(entity =>
            entity.sourceNodeId && upstreamNodeIds.has(entity.sourceNodeId)
        );
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

    setAnalysisResults: (results) => {
        const grouped: Record<string, AnalysisResult[]> = {};
        results.forEach(item => {
            const key = item.targetNodeId || 'global';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });
        set({ analysisResults: grouped });
    },

    clearAnalysisResults: () => set({ analysisResults: {} }),

    // [New] Asset & Traceability Actions Implementation
    setViewMode: (mode) => set({ viewMode: mode }),
    setAssetUrl: (url) => set({ assetUrl: url }),

    // Node 선택 -> 해당하는 Source Region 찾아서 Highlight
    selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
    },

    // Source 선택 -> 해당하는 Node 찾아서 Highlight
    selectSourceRegion: (ref) => {
        set({ selectedSourceRegion: ref });
    },

    setProcessMetadata: (name, description) => set({ processMetadata: { name, description } }),

    reset: () => set({
        nodes: [], edges: [], processMetadata: null, currentProcess: null,
        dataEntities: [], dataGroups: [], formDefinitions: [], analysisResults: {}, selectedEdgeId: null,
        // Reset Asset State
        viewMode: 'DEFAULT', assetUrl: null, selectedNodeId: null, selectedSourceRegion: null
    }),

    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
    onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
    addNode: (node) => set({ nodes: [...get().nodes, node] }),
}));