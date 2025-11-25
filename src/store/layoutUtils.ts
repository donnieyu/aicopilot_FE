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
// [Fix] 미사용 변수 제거 및 의미에 맞는 변수명으로 변경 (고정 너비 -> 최소 너비)
const TB_SWIMLANE_MIN_WIDTH = 800;
const TB_LANE_PADDING = 50;

export type LayoutDirection = 'LR' | 'TB';

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
    if (direction === 'TB') {
        return getLayoutedElementsTB(nodes, edges, swimlanes);
    }
    return getLayoutedElementsLR(nodes, edges, swimlanes);
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

    let minDagreY = Infinity;
    let maxDagreY = -Infinity;

    nodes.forEach(node => {
        if (['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(node.type || '')) {
            if (node.data.swimlaneId && swimlaneNodesMap[node.data.swimlaneId]) {
                swimlaneNodesMap[node.data.swimlaneId].push(node);
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

    const finalNodes = nodes.map(node => {
        if (['USER_TASK', 'SERVICE_TASK', 'EXCLUSIVE_GATEWAY'].includes(node.type || '')) {
            const dNode = dagreGraph.node(node.id);
            const swimlaneIndex = swimlanes.findIndex(sl => sl.swimlaneId === node.data.swimlaneId);
            const currentLaneNodes = swimlaneNodesMap[node.data.swimlaneId];

            let minLaneDagreX = Infinity;
            let maxLaneDagreX = -Infinity;

            currentLaneNodes.forEach(n => {
                const dn = dagreGraph.node(n.id);
                if (dn.x < minLaneDagreX) minLaneDagreX = dn.x;
                if (dn.x > maxLaneDagreX) maxLaneDagreX = dn.x;
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

        if (node.type === 'SWIMLANE') {
            const index = swimlanes.findIndex(sl => sl.swimlaneId === node.id);
            return {
                ...node,
                position: { x: index * LR_SWIMLANE_WIDTH, y: 0 },
                style: {
                    width: LR_SWIMLANE_WIDTH,
                    height: swimlaneHeight
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
            if (node.data.swimlaneId && swimlaneNodesMap[node.data.swimlaneId]) {
                swimlaneNodesMap[node.data.swimlaneId].push(node);
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

        laneNodes.forEach(node => {
            const dNode = dagreGraph.node(node.id);
            if (dNode) {
                if (dNode.y < minDagreY) minDagreY = dNode.y;
                if (dNode.y > maxDagreY) maxDagreY = dNode.y;
            }
        });

        let laneHeight = TB_SWIMLANE_MIN_HEIGHT;
        if (laneNodes.length > 0) {
            const contentHeight = maxDagreY - minDagreY + NODE_HEIGHT;
            laneHeight = Math.max(TB_SWIMLANE_MIN_HEIGHT, contentHeight + (TB_LANE_PADDING * 2));
        }

        swimlaneLayouts[lane.swimlaneId] = { y: currentY, height: laneHeight };

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
            if (layout) {
                return {
                    ...node,
                    position: { x: -100, y: layout.y },
                    style: {
                        // [Fix] 하드코딩된 800 대신 최소 너비 상수 사용
                        width: Math.max(maxWidth + 200, TB_SWIMLANE_MIN_WIDTH),
                        height: layout.height
                    },
                    zIndex: -1
                };
            }
        }
        return node;
    });

    return { nodes: finalNodes, edges };
};