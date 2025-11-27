import type { Edge } from 'reactflow';

/**
 * 특정 노드(nodeId)로 들어오는 모든 상위(Upstream) 노드의 ID를 찾아냅니다.
 * (BFS 탐색을 통해 직접 연결뿐 아니라, 조상의 조상까지 모두 찾습니다)
 *
 * @param nodeId - 기준이 되는 노드 ID (현재 포커스 된 노드)
 * @param edges - 전체 엣지 리스트
 * @returns 상위 노드 ID들의 집합 (Set)
 */
export const getUpstreamNodeIds = (
    nodeId: string,
    edges: Edge[]
): Set<string> => {
    const upstreamNodeIds = new Set<string>();
    const queue = [nodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentId = queue.shift()!;

        // 이미 방문한 노드라면 스킵 (순환 참조 방지)
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        // 현재 노드를 Target으로 하는 모든 Edge를 찾음 (Source가 상위 노드)
        const incomingEdges = edges.filter((e) => e.target === currentId);

        incomingEdges.forEach((edge) => {
            if (!upstreamNodeIds.has(edge.source)) {
                upstreamNodeIds.add(edge.source);
                // 상위 노드의 상위 노드를 찾기 위해 큐에 추가
                queue.push(edge.source);
            }
        });
    }

    return upstreamNodeIds;
};