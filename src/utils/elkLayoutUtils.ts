import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge, Position } from 'reactflow';
import type { Swimlane } from '../types/workflow';

const elk = new ELK();

// Node Dimensions
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const GATEWAY_SIZE = 60;
const START_END_SIZE = 40;

// ELK Layout Options
const DEFAULT_LAYOUT_OPTIONS = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT', // LR: 왼쪽에서 오른쪽으로 흐름

    // 레이어(가로) 간격: 엣지가 꺾여 들어갈 공간 확보
    'elk.layered.spacing.nodeNodeBetweenLayers': '200',

    // 노드(세로) 간격: 분기된 노드들이 위아래로 겹치지 않게 충분히 확보
    'elk.spacing.nodeNode': '150',

    // 엣지 라우팅 설정
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.layered.mergeEdges': 'true',

    // 계층 구조를 무시하고 전체를 평평하게 배치하여 최적의 위치를 찾음
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',

    // 직선 배치 선호도를 낮추어 분기를 더 확실하게 표현
    'elk.layered.nodePlacement.favorStraightness': '0.5',

    // 노드 배치 전략: 분기 처리에 유리한 전략 사용
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
};

export type LayoutDirection = 'LR' | 'TB';

interface ElkNodeExtended extends ElkNode {
    children?: ElkNodeExtended[];
}

/**
 * React Flow Nodes/Edges -> ELK Graph -> Layouted React Flow Nodes/Edges
 * 전략: 노드들을 제약 없이 배치한 후, 그 위치에 맞춰 스윔레인을 배경으로 그립니다.
 */
export const getElkLayoutedElements = async (
    nodes: Node[],
    edges: Edge[],
    swimlanes: Swimlane[],
    direction: LayoutDirection = 'LR'
) => {
    // 1. ELK용 노드 생성 (스윔레인 제외, 모두 Root의 자식으로 취급)
    const elkNodes: ElkNodeExtended[] = [];

    nodes.forEach(node => {
        // 스윔레인 노드는 레이아웃 계산에서 제외 (나중에 좌표로 재생성)
        if (node.type === 'SWIMLANE') return;

        let width = NODE_WIDTH;
        let height = NODE_HEIGHT;

        if (node.type === 'EXCLUSIVE_GATEWAY') {
            width = GATEWAY_SIZE;
            height = GATEWAY_SIZE;
        } else if (node.type === 'START' || node.type === 'END') {
            width = START_END_SIZE;
            height = START_END_SIZE;
        }

        elkNodes.push({
            id: node.id,
            width,
            height,
            layoutOptions: {
                // 포트 제약 해제: ELK가 최적의 연결 지점을 찾도록 함
                // 필요시 'elk.portConstraints': 'FIXED_SIDE' 사용 가능
            }
        });
    });

    const graph: ElkNode = {
        id: 'root',
        layoutOptions: {
            ...DEFAULT_LAYOUT_OPTIONS,
            'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
        },
        children: elkNodes,
        edges: edges.map(edge => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target]
        } as ElkExtendedEdge))
    };

    // 2. ELK 레이아웃 실행
    try {
        const layoutedGraph = await elk.layout(graph);
        const layoutedNodes: Node[] = [];

        // 3. Activity 노드 위치 업데이트 및 엣지 방향에 따른 핸들 조정
        // 먼저 노드들의 위치를 맵에 저장해둡니다 (나중에 참조용)
        const nodePositions: Record<string, { x: number, y: number, width: number, height: number }> = {};

        layoutedGraph.children?.forEach((node) => {
            nodePositions[node.id] = {
                x: node.x || 0,
                y: node.y || 0,
                width: node.width || 0,
                height: node.height || 0
            };
        });

        // 실제 React Flow 노드 생성
        layoutedGraph.children?.forEach((elkNode) => {
            const originalNode = nodes.find(n => n.id === elkNode.id);
            if (!originalNode) return;

            // 기본 핸들 위치 (LR 기준)
            // 'right' as Position 으로 타입 단언하여 TS 에러 방지
            let sourcePos = (direction === 'LR' ? 'right' : 'bottom') as Position;
            let targetPos = (direction === 'LR' ? 'left' : 'top') as Position;

            // [New] Dynamic Handle Positioning
            // 이 노드에서 출발하는 엣지들을 확인하여 역방향(Loop)이 있는지 체크
            const outgoingEdges = edges.filter(e => e.source === elkNode.id);
            // let hasBackwardEdge = false; // 현재 미사용으로 주석 처리

            outgoingEdges.forEach(edge => {
                const targetNodePos = nodePositions[edge.target];
                const sourceNodePos = nodePositions[edge.source];

                if (targetNodePos && sourceNodePos) {
                    // 타겟이 소스보다 왼쪽에 있으면 역방향(Loop)임
                    if (targetNodePos.x < sourceNodePos.x) {
                        // hasBackwardEdge = true;
                        // 역방향일 경우 출발점을 조정할 수 있음 (여기서는 기본 유지)
                    }
                }
            });

            layoutedNodes.push({
                ...originalNode,
                position: {
                    x: elkNode.x || 0,
                    y: elkNode.y || 0
                },
                sourcePosition: sourcePos,
                targetPosition: targetPos,
                zIndex: 10 // 노드를 엣지보다 위에 그리기
            });
        });

        // 4. [New] Swimlane 동적 계산 (Dynamic Swimlane Sizing)
        // 배치된 노드들의 좌표를 기반으로 스윔레인 영역을 계산합니다.
        const swimlaneNodes: Node[] = [];
        const lanePadding = 60; // 스윔레인 내부 여백

        // 각 스윔레인별로 포함된 노드들의 Min/Max 좌표 계산
        const laneBounds: Record<string, { minX: number, maxX: number, minY: number, maxY: number }> = {};

        layoutedNodes.forEach(node => {
            const laneId = node.data?.swimlaneId;
            if (!laneId) return;

            // 노드의 현재 경계박스 계산
            const nX = node.position.x;
            const nY = node.position.y;
            // width/height가 없으면 기본값 사용
            const nW = (node.width as number) || (node.type === 'EXCLUSIVE_GATEWAY' ? GATEWAY_SIZE : NODE_WIDTH);
            const nH = (node.height as number) || (node.type === 'EXCLUSIVE_GATEWAY' ? GATEWAY_SIZE : NODE_HEIGHT);

            if (!laneBounds[laneId]) {
                laneBounds[laneId] = { minX: nX, maxX: nX + nW, minY: nY, maxY: nY + nH };
            } else {
                laneBounds[laneId].minX = Math.min(laneBounds[laneId].minX, nX);
                laneBounds[laneId].maxX = Math.max(laneBounds[laneId].maxX, nX + nW);
                laneBounds[laneId].minY = Math.min(laneBounds[laneId].minY, nY);
                laneBounds[laneId].maxY = Math.max(laneBounds[laneId].maxY, nY + nH);
            }
        });

        // 계산된 경계를 바탕으로 스윔레인 노드 생성
        swimlanes.forEach(lane => {
            const bounds = laneBounds[lane.swimlaneId];

            // 해당 레인에 노드가 없으면 기본 크기로 생성하거나 생략
            if (!bounds) return;

            const width = (bounds.maxX - bounds.minX) + (lanePadding * 2);
            const height = (bounds.maxY - bounds.minY) + (lanePadding * 2);

            swimlaneNodes.push({
                id: lane.swimlaneId,
                type: 'SWIMLANE',
                data: { label: lane.name },
                // 노드들을 감싸도록 위치 조정
                position: {
                    x: bounds.minX - lanePadding,
                    y: bounds.minY - lanePadding
                },
                style: {
                    width,
                    height,
                    backgroundColor: 'rgba(248, 250, 252, 0.5)', // 투명도 있는 배경
                    zIndex: -1
                }
            });
        });

        // 5. 최종 노드 병합 (스윔레인이 배경으로 깔리도록 순서 주의)
        // React Flow는 배열 순서대로 렌더링하므로 스윔레인을 먼저 넣습니다.
        return {
            nodes: [...swimlaneNodes, ...layoutedNodes],
            edges
        };

    } catch (error) {
        console.error("ELK Layout Failed:", error);
        return { nodes, edges };
    }
};