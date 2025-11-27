import dagre from 'dagre';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import type { Swimlane } from '../types/workflow';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const START_END_WIDTH = 80;
const SWIMLANE_HEADER_HEIGHT = 50;

// [LR Layout Constants]
const LR_SWIMLANE_WIDTH = 700;
const LR_LANE_INTERNAL_PADDING_X = 100;
const LR_LANE_INTERNAL_PADDING_Y = 50;

// [TB Layout Constants]
const TB_SWIMLANE_MIN_HEIGHT = 200;
const TB_SWIMLANE_MIN_WIDTH = 800;
const TB_LANE_PADDING = 50;

export type LayoutDirection = 'LR' | 'TB';

// [New] 고아 노드(Swimlane 없는 노드)를 위한 가상 Lane ID
const ORPHAN_LANE_ID = '__orphan_lane__';

/**
 * Main Layout Function
 * Dispatches to specific layout strategy based on direction.
 */
export const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    swimlanes: Swimlane[],
    direction: LayoutDirection = 'LR'
) => {
    // 0. Pre-processing: 고아 노드 감지 및 가상 스윔레인 추가
    const orphanNodes = nodes.filter(n =>
        ['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(n.type || '') && !n.data.swimlaneId
    );

    let processedSwimlanes = [...swimlanes];

    // 고아 노드가 있다면 'Unassigned' 스윔레인을 마지막에 추가하여 강제로 할당
    if (orphanNodes.length > 0) {
        processedSwimlanes.push({
            swimlaneId: ORPHAN_LANE_ID,
            name: 'Unassigned (System/Error)', // 시각적으로 구분되는 이름
            nextSwimlaneId: undefined
        });

        // 고아 노드들에 가상 Lane ID 부여 (원본 노드 객체 수정 없이 클론 사용 권장하지만, 여기선 직접 할당)
        orphanNodes.forEach(n => {
            n.data.swimlaneId = ORPHAN_LANE_ID;
            // 시각적 피드백: 고아 노드임을 알 수 있게 스타일이나 라벨 변경 가능 (선택 사항)
            // n.style = { ...n.style, border: '2px dashed red' };
        });
    }

    if (direction === 'TB') {
        return getLayoutedElementsTB(nodes, edges, processedSwimlanes);
    }
    return getLayoutedElementsLR(nodes, edges, processedSwimlanes);
};

// -----------------------------------------------------------------------------
// 1. Left-to-Right Layout Strategy (Horizontal Flow, Vertical Swimlanes Stack)
// -----------------------------------------------------------------------------
const getLayoutedElementsLR = (
    nodes: Node[],
    edges: Edge[],
    swimlanes: Swimlane[]
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: 'LR',
        ranksep: 80,
        nodesep: 60
    });

    // 1. Dagre Graph에 노드 추가
    nodes.forEach((node) => {
        if (node.type === 'SWIMLANE' || node.type === 'START' || node.type === 'END') return;
        const isGateway = node.type === 'EXCLUSIVE_GATEWAY';
        dagreGraph.setNode(node.id, {
            width: isGateway ? 80 : NODE_WIDTH,
            height: isGateway ? 80 : NODE_HEIGHT
        });
    });

    // 2. Dagre Graph에 엣지 추가
    edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (sourceNode?.type !== 'START' && sourceNode?.type !== 'SWIMLANE' &&
            targetNode?.type !== 'END' && targetNode?.type !== 'SWIMLANE') {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // 3. Dagre 레이아웃 계산
    dagre.layout(dagreGraph);

    // 4. 스윔레인별 노드 그룹화
    const swimlaneNodesMap: Record<string, Node[]> = {};
    swimlanes.forEach(sl => swimlaneNodesMap[sl.swimlaneId] = []);

    let minDagreY = Infinity;
    let maxDagreY = -Infinity;

    nodes.forEach(node => {
        if (['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(node.type || '')) {
            const laneId = node.data.swimlaneId;
            if (laneId && swimlaneNodesMap[laneId]) {
                swimlaneNodesMap[laneId].push(node);
            }

            const dNode = dagreGraph.node(node.id);
            if (dNode) {
                if (dNode.y < minDagreY) minDagreY = dNode.y;
                if (dNode.y > maxDagreY) maxDagreY = dNode.y;
            }
        }
    });

    if (minDagreY === Infinity) minDagreY = 0;
    if (maxDagreY === -Infinity) maxDagreY = 0;

    const graphContentHeight = maxDagreY - minDagreY + NODE_HEIGHT;
    const swimlaneHeight = Math.max(500, graphContentHeight + (LR_LANE_INTERNAL_PADDING_Y * 2) + 100);

    // 5. 최종 노드 위치 계산
    const finalNodes = nodes.map(node => {
        // Activity Nodes 처리
        if (['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(node.type || '')) {
            const dNode = dagreGraph.node(node.id);
            const laneId = node.data.swimlaneId;

            // [Safety Net] 이미 Pre-processing에서 할당했으므로 여기서는 안전하게 존재해야 함
            // 만약 여전히 없다면 정말 예외적인 상황이므로 Dagre 좌표 사용
            if (!laneId || !swimlaneNodesMap[laneId]) {
                return {
                    ...node,
                    position: {
                        x: dNode ? dNode.x - (NODE_WIDTH / 2) : 0,
                        y: dNode ? dNode.y - (NODE_HEIGHT / 2) : 0
                    },
                    targetPosition: Position.Left,
                    sourcePosition: Position.Right
                };
            }

            const swimlaneIndex = swimlanes.findIndex(sl => sl.swimlaneId === laneId);
            const currentLaneNodes = swimlaneNodesMap[laneId];

            if (!currentLaneNodes) return node;

            let minLaneDagreX = Infinity;
            let maxLaneDagreX = -Infinity;

            currentLaneNodes.forEach(n => {
                const dn = dagreGraph.node(n.id);
                if (dn && dn.x < minLaneDagreX) minLaneDagreX = dn.x;
                if (dn && dn.x > maxLaneDagreX) maxLaneDagreX = dn.x;
            });

            if (minLaneDagreX === Infinity) minLaneDagreX = 0;
            if (maxLaneDagreX === -Infinity) maxLaneDagreX = 0;

            const contentWidth = maxLaneDagreX - minLaneDagreX;
            const availableWidth = LR_SWIMLANE_WIDTH - (LR_LANE_INTERNAL_PADDING_X * 2);

            let scaleFactor = 1;
            if (contentWidth > availableWidth && contentWidth > 0) {
                scaleFactor = availableWidth / contentWidth;
            }

            const laneStartX = swimlaneIndex * LR_SWIMLANE_WIDTH;
            const relativeX = (dNode.x - minLaneDagreX) * scaleFactor;

            let centerOffset = 0;
            if (contentWidth * scaleFactor < availableWidth) {
                centerOffset = (availableWidth - (contentWidth * scaleFactor)) / 2;
            }

            const x = laneStartX + LR_LANE_INTERNAL_PADDING_X + centerOffset + relativeX;
            const relativeY = dNode.y - minDagreY;
            const startY = (swimlaneHeight - graphContentHeight) / 2 + SWIMLANE_HEADER_HEIGHT;
            const y = startY + relativeY;

            node.position = {
                x: x - (node.type === 'EXCLUSIVE_GATEWAY' ? 40 : NODE_WIDTH / 2),
                y: y - (NODE_HEIGHT / 2)
            };

            node.targetPosition = Position.Left;
            node.sourcePosition = Position.Right;
            return node;
        }

        // Swimlane Nodes 처리
        if (node.type === 'SWIMLANE') {
            // [Update] 고아 스윔레인 처리: ORPHAN_LANE_ID인 경우 스타일 다르게 적용 가능
            const index = swimlanes.findIndex(sl => sl.swimlaneId === node.id);
            const isOrphanLane = node.id === ORPHAN_LANE_ID;

            return {
                ...node,
                position: { x: index * LR_SWIMLANE_WIDTH, y: 0 },
                style: {
                    width: LR_SWIMLANE_WIDTH,
                    height: swimlaneHeight,
                    backgroundColor: isOrphanLane ? '#fff1f2' : undefined, // 연한 빨간색 배경
                    borderStyle: isOrphanLane ? 'dashed' : undefined,
                    borderColor: isOrphanLane ? '#fda4af' : undefined
                },
                zIndex: -1
            };
        }
        return node;
    });

    const totalWidth = swimlanes.length * LR_SWIMLANE_WIDTH;
    const centerY = swimlaneHeight / 2;

    const nodesWithStartEnd = finalNodes.map(node => {
        if (node.type === 'START') {
            node.position = { x: -150, y: centerY - (START_END_WIDTH / 2) };
            node.sourcePosition = Position.Right;
            return node;
        }
        if (node.type === 'END') {
            node.position = { x: totalWidth + 100, y: centerY - (START_END_WIDTH / 2) };
            node.targetPosition = Position.Left;
            return node;
        }
        return node;
    });

    return { nodes: nodesWithStartEnd, edges };
};

// -----------------------------------------------------------------------------
// 2. Top-to-Bottom Layout Strategy (Vertical Flow, Horizontal Swimlanes Stack)
// -----------------------------------------------------------------------------
const getLayoutedElementsTB = (
    nodes: Node[],
    edges: Edge[],
    swimlanes: Swimlane[]
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: 'TB',
        ranksep: 60,
        nodesep: 50
    });

    nodes.forEach((node) => {
        if (node.type === 'SWIMLANE' || node.type === 'START' || node.type === 'END') return;
        const isGateway = node.type === 'EXCLUSIVE_GATEWAY';
        dagreGraph.setNode(node.id, {
            width: isGateway ? 80 : NODE_WIDTH,
            height: isGateway ? 80 : NODE_HEIGHT
        });
    });

    edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (sourceNode?.type !== 'START' && sourceNode?.type !== 'SWIMLANE' &&
            targetNode?.type !== 'END' && targetNode?.type !== 'SWIMLANE') {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    const swimlaneNodesMap: Record<string, Node[]> = {};
    swimlanes.forEach(sl => swimlaneNodesMap[sl.swimlaneId] = []);

    nodes.forEach(node => {
        if (['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(node.type || '')) {
            const laneId = node.data.swimlaneId;
            if (laneId && swimlaneNodesMap[laneId]) {
                swimlaneNodesMap[laneId].push(node);
            }
        }
    });

    let currentY = 80 + 50; // Start Node Height + Padding
    let maxWidth = 0;
    const swimlaneLayouts: Record<string, { y: number, height: number }> = {};

    swimlanes.forEach((lane) => {
        const laneNodes = swimlaneNodesMap[lane.swimlaneId];
        let minDagreY = Infinity;
        let maxDagreY = -Infinity;

        if (laneNodes) {
            laneNodes.forEach(node => {
                const dNode = dagreGraph.node(node.id);
                if (dNode) {
                    if (dNode.y < minDagreY) minDagreY = dNode.y;
                    if (dNode.y > maxDagreY) maxDagreY = dNode.y;
                }
            });
        }

        let laneHeight = TB_SWIMLANE_MIN_HEIGHT;
        if (laneNodes && laneNodes.length > 0) {
            const contentHeight = maxDagreY - minDagreY + NODE_HEIGHT;
            laneHeight = Math.max(TB_SWIMLANE_MIN_HEIGHT, contentHeight + (TB_LANE_PADDING * 2));
        }

        swimlaneLayouts[lane.swimlaneId] = { y: currentY, height: laneHeight };

        if (laneNodes) {
            laneNodes.forEach(node => {
                const dNode = dagreGraph.node(node.id);
                const x = dNode.x;
                const relativeY = dNode.y - minDagreY;
                const y = currentY + TB_LANE_PADDING + relativeY;

                node.position = { x: x - (NODE_WIDTH / 2), y: y - (NODE_HEIGHT / 2) };
                node.targetPosition = Position.Top;
                node.sourcePosition = Position.Bottom;

                if (x + NODE_WIDTH > maxWidth) maxWidth = x + NODE_WIDTH;
            });
        }

        currentY += laneHeight;
    });

    const centerX = maxWidth > 0 ? maxWidth / 2 : 400;

    const finalNodes = nodes.map(node => {
        if (node.type === 'START') {
            node.position = { x: centerX - 40, y: 0 };
            node.sourcePosition = Position.Bottom;
            return node;
        }
        if (node.type === 'END') {
            node.position = { x: centerX - 40, y: currentY + 50 };
            node.targetPosition = Position.Top;
            return node;
        }
        if (node.type === 'SWIMLANE') {
            const layout = swimlaneLayouts[node.id];
            const isOrphanLane = node.id === ORPHAN_LANE_ID;

            if (layout) {
                return {
                    ...node,
                    position: { x: -100, y: layout.y },
                    style: {
                        width: Math.max(maxWidth + 200, TB_SWIMLANE_MIN_WIDTH),
                        height: layout.height,
                        backgroundColor: isOrphanLane ? '#fff1f2' : undefined,
                        borderStyle: isOrphanLane ? 'dashed' : undefined,
                        borderColor: isOrphanLane ? '#fda4af' : undefined
                    },
                    zIndex: -1
                };
            }
        }
        // [TB Fix] Pre-processing에서 처리되지 않은 노드들 방어
        if (['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(node.type || '') && !node.data.swimlaneId) {
            const dNode = dagreGraph.node(node.id);
            return {
                ...node,
                position: {
                    x: dNode ? dNode.x - (NODE_WIDTH / 2) : 0,
                    y: dNode ? dNode.y - (NODE_HEIGHT / 2) : 0
                },
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom
            };
        }

        return node;
    });

    return { nodes: finalNodes, edges };
};