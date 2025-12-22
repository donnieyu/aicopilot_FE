import { useCallback, useRef } from 'react';
import type { Edge } from 'reactflow';
import { useWorkflowStore } from '../store/useWorkflowStore';

const HOVER_TIMEOUT_MS = 300;

export function useEdgeHover() {
    const setEdgeHover = useWorkflowStore((state) => state.setEdgeHover);
    // 엣지 ID별 타이머 맵 관리
    // [Fix] 초기값을 null로 하고 내부에서 생성하거나, 확실하게 Map으로 초기화
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const handleEdgeMouseEnter = useCallback((_: React.MouseEvent, edge: Edge) => {
        const edgeId = edge.id;

        // [Fix] Safety check for timersRef.current
        if (!timersRef.current) {
            timersRef.current = new Map();
        }

        // 기존 OFF 타이머 취소
        const existingTimer = timersRef.current.get(edgeId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            timersRef.current.delete(edgeId);
        }
        // 호버 켜기
        setEdgeHover(edgeId, true);
    }, [setEdgeHover]);

    const handleEdgeMouseLeave = useCallback((_: React.MouseEvent, edge: Edge) => {
        const edgeId = edge.id;

        // [Fix] Safety check for timersRef.current
        if (!timersRef.current) {
            timersRef.current = new Map();
        }

        // 기존 타이머 취소 (안전장치)
        const existingTimer = timersRef.current.get(edgeId);
        if (existingTimer) clearTimeout(existingTimer);

        // OFF 예약
        const timer = setTimeout(() => {
            // [Check] 버튼 위에 마우스가 있는지 확인 (Store 상태 조회)
            const isPinned = useWorkflowStore.getState().pinnedEdges[edgeId];
            if (!isPinned) {
                setEdgeHover(edgeId, false);
            }
            // [Fix] 타이머 실행 시점에도 ref가 유효한지 확인 (컴포넌트 언마운트 등 고려)
            if (timersRef.current) {
                timersRef.current.delete(edgeId);
            }
        }, HOVER_TIMEOUT_MS);

        timersRef.current.set(edgeId, timer);
    }, [setEdgeHover]);

    return {
        handleEdgeMouseEnter,
        handleEdgeMouseLeave
    };
}