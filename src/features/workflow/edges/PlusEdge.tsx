import { useState, useRef, useEffect } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

// 상대 경로를 사용하여 정확하게 참조를 해결합니다.
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import { EdgeContextMenu } from '../components/EdgeContextMenu';

/**
 * 플러스 버튼과 삭제 버튼이 포함된 커스텀 엣지 컴포넌트.
 * 잠금(Locked) 상태에서는 편집 도구가 표시되지 않습니다.
 */
export default function PlusEdge({
                                     id,
                                     sourceX,
                                     sourceY,
                                     targetX,
                                     targetY,
                                     sourcePosition,
                                     targetPosition,
                                     style = {},
                                     markerEnd,
                                 }: EdgeProps) {
    const { deleteElements } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const hoveredEdges = useWorkflowStore((state) => state.hoveredEdges);
    const insertNode = useWorkflowStore((state) => state.insertNode);
    const setEdgeHover = useWorkflowStore((state) => state.setEdgeHover);
    const setEdgePin = useWorkflowStore((state) => state.setEdgePin);

    // 전역 잠금 상태 구독
    const isLocked = useWorkflowStore((state) => state.isLocked);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isHovered = !!hoveredEdges[id];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const onAddClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (isLocked) return; // 잠금 상태 시 동작 방지
        setIsMenuOpen((prev) => !prev);
    };

    const onDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (isLocked) return; // 잠금 상태 시 동작 방지
        deleteElements({ edges: [{ id }] });
    };

    const handleInsert = async (type: 'USER_TASK' | 'SERVICE_TASK' | 'EXCLUSIVE_GATEWAY') => {
        if (isLocked) return;
        await insertNode(id, type);
        setIsMenuOpen(false);
    };

    const handleLabelEnter = () => {
        if (isLocked) return;
        setEdgePin(id, true);
        setEdgeHover(id, true);
    };

    const handleLabelLeave = () => {
        setEdgePin(id, false);
    };

    // 잠금 상태(isLocked)일 때는 호버되어도 편집 버튼을 노출하지 않음
    const isVisible = (isHovered || isMenuOpen) && !isLocked;

    return (
        <>
            <path
                d={edgePath}
                fill="none"
                strokeWidth={20}
                stroke="transparent"
                className="react-flow__edge-path-selector"
                style={{ cursor: isLocked ? 'default' : 'pointer', pointerEvents: isLocked ? 'none' : 'stroke' }}
            />

            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeDasharray: 'none',
                    animation: 'none',
                    stroke: isVisible ? '#3b82f6' : '#b1b1b7',
                    strokeWidth: isVisible ? 2 : 1.5,
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                    pointerEvents: 'none'
                }}
            />

            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        // 잠금 상태 시 레이블 영역 상호작용 차단
                        pointerEvents: isLocked ? 'none' : 'all',
                        zIndex: 100
                    }}
                    className="nodrag nopan flex items-center gap-1"
                    onMouseEnter={handleLabelEnter}
                    onMouseLeave={handleLabelLeave}
                    ref={menuRef}
                >
                    <div
                        className={clsx(
                            "flex items-center gap-1 transition-all duration-200 transform p-1 rounded-full",
                            isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
                        )}
                    >
                        <button
                            className={clsx(
                                "w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110",
                                isMenuOpen ? "border-blue-500 text-blue-600 ring-2 ring-blue-100" : "hover:border-blue-500 hover:text-blue-600 text-slate-400"
                            )}
                            onClick={onAddClick}
                            title="Add Node"
                        >
                            <Plus size={14} />
                        </button>

                        <button
                            className="w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 hover:border-red-500 hover:text-red-500 text-slate-400"
                            onClick={onDeleteClick}
                            title="Delete Connection"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>

                    {isMenuOpen && !isLocked && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2">
                            <EdgeContextMenu
                                x={0}
                                y={0}
                                onSelect={handleInsert}
                                onClose={() => setIsMenuOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}