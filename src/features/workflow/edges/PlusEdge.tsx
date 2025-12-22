import { useState, useRef, useEffect } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { Plus, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import { EdgeContextMenu } from '../components/EdgeContextMenu';
import clsx from 'clsx';
// [Removed] useEdgeHover hook import removal as it's for Canvas only

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
    // [New] Direct store actions
    const setEdgeHover = useWorkflowStore((state) => state.setEdgeHover);
    const setEdgePin = useWorkflowStore((state) => state.setEdgePin);

    // [Removed] useEdgeHover call

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
        setIsMenuOpen((prev) => !prev);
    };

    const onDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        deleteElements({ edges: [{ id }] });
    };

    const handleInsert = async (type: 'USER_TASK' | 'SERVICE_TASK' | 'EXCLUSIVE_GATEWAY') => {
        await insertNode(id, type);
        setIsMenuOpen(false);
    };

    // Label Interaction Handlers
    const handleLabelEnter = () => {
        setEdgePin(id, true);
        setEdgeHover(id, true);
    };

    const handleLabelLeave = () => {
        setEdgePin(id, false);
        // Canvas's onEdgeMouseLeave will handle the timeout if mouse moved out of everything.
        // If mouse moved back to Edge, onEdgeMouseEnter will keep it on.
        // We set unpinned, so next timer execution will successfully hide it.
    };

    const isVisible = isHovered || isMenuOpen;

    return (
        <>
            <path
                d={edgePath}
                fill="none"
                strokeWidth={20}
                stroke="transparent"
                className="react-flow__edge-path-selector"
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                // [Note] No handlers here, Canvas handles edge hover
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
                        pointerEvents: 'all',
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

                    {isMenuOpen && (
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