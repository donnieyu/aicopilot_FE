import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel,
    type Node,
    type NodeTypes,
    type EdgeTypes,
} from 'reactflow';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useWorkflowGenerator } from '../../hooks/useWorkflowGenerator';
import {
    UserTaskNode,
    ServiceTaskNode,
    GatewayNode,
    StartNode,
    EndNode,
    SwimlaneNode
} from './nodes/CustomNodes';
import PlusEdge from './edges/PlusEdge';
import 'reactflow/dist/style.css';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useEdgeHover } from '../../hooks/useEdgeHover';

const nodeTypes: NodeTypes = {
    USER_TASK: UserTaskNode,
    SERVICE_TASK: ServiceTaskNode,
    EXCLUSIVE_GATEWAY: GatewayNode,
    START: StartNode,
    END: EndNode,
    SWIMLANE: SwimlaneNode,
};

const edgeTypes: EdgeTypes = {
    PLUS_EDGE: PlusEdge,
};

interface WorkflowCanvasProps {
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

const FlowContent = ({ onNodeClick }: WorkflowCanvasProps) => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

    // 전역 잠금 상태 구독
    const isLocked = useWorkflowStore(state => state.isLocked);
    const setIsLocked = useWorkflowStore(state => state.setIsLocked);

    // 채팅/생성 진행 상태 구독
    const { isProcessing } = useWorkflowGenerator();

    // 채팅 시작 전의 잠금 상태를 저장하기 위한 ref
    const previousLockState = useRef<boolean>(isLocked);

    // 채팅 진행 상태에 따른 잠금 제어 로직
    useEffect(() => {
        if (isProcessing) {
            // 작업 시작 시 현재 상태 저장 후 강제 잠금
            previousLockState.current = isLocked;
            setIsLocked(true);
        } else {
            // 작업 종료 시 저장했던 이전 상태로 복구
            setIsLocked(previousLockState.current);
        }
    }, [isProcessing, setIsLocked]);

    const { handleEdgeMouseEnter, handleEdgeMouseLeave } = useEdgeHover();

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
            onNodeClick(event, node);
        }
    }, [onNodeClick]);

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: 'PLUS_EDGE' }}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                onNodeClick={handleNodeClick}
                // 잠금 상태에 따라 노드 조작 제한
                nodesDraggable={!isLocked}
                nodesConnectable={!isLocked}
                elementsSelectable={true}
                panOnDrag={true}
                zoomOnScroll={true}
                edgesFocusable={false}
                onEdgeMouseEnter={handleEdgeMouseEnter}
                onEdgeMouseLeave={handleEdgeMouseLeave}
            >
                <Background gap={20} size={1} color="#e2e8f0" />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        if (node.type === 'START') return '#22c55e';
                        if (node.type === 'END') return '#ef4444';
                        if (node.type === 'SWIMLANE') return '#f1f5f9';
                        return '#3b82f6';
                    }}
                />

                <Panel position="top-center" className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-slate-200 mt-4 flex gap-1">
                    <button
                        onClick={() => setIsLocked(true)}
                        // 채팅 중일 때는 이미 잠긴 상태이므로 버튼 무의미
                        disabled={isProcessing}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            isLocked ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100",
                            isProcessing && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Lock size={12} />
                        <span>Locked</span>
                    </button>
                    <button
                        onClick={() => setIsLocked(false)}
                        // 채팅 중일 때는 수동 잠금 해제 금지
                        disabled={isProcessing}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            !isLocked ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100",
                            isProcessing && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Unlock size={12} />
                        )}
                        <span>{isProcessing ? 'AI Working...' : 'Edit'}</span>
                    </button>
                </Panel>
            </ReactFlow>
        </>
    );
};

export const WorkflowCanvas = (props: WorkflowCanvasProps) => {
    return (
        <div className="w-full h-full bg-white relative">
            <ReactFlowProvider>
                <FlowContent {...props} />
            </ReactFlowProvider>
        </div>
    );
};