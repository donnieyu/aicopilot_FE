import { useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel,
    type Node,
    type NodeTypes,
    type EdgeTypes,
    // [Fix] Removed 'Edge' type import as it's not used directly here
} from 'reactflow';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import {
    UserTaskNode,
    ServiceTaskNode,
    GatewayNode,
    StartNode,
    EndNode,
    SwimlaneNode
} from './nodes/CustomNodes';
import PlusEdge from './edges/PlusEdge';
import { AnalysisConsole } from './components/AnalysisConsole';
import 'reactflow/dist/style.css';
import { Lock, Unlock } from 'lucide-react';
import clsx from 'clsx';
import { useEdgeHover } from '../../hooks/useEdgeHover'; // [New] Import Hook

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
    const [isLocked, setIsLocked] = useState(false);

    // [New] Use Global Edge Hover Hook
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
                attributionPosition="bottom-right"
                snapToGrid={true}
                snapGrid={[15, 15]}
                onNodeClick={handleNodeClick}
                nodesDraggable={!isLocked}
                nodesConnectable={!isLocked}
                elementsSelectable={true}
                panOnDrag={true}
                zoomOnScroll={true}
                edgesFocusable={false}
                // [New] Connect Handlers
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
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            isLocked ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <Lock size={12} />
                        <span>Locked</span>
                    </button>
                    <button
                        onClick={() => setIsLocked(false)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            !isLocked ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <Unlock size={12} />
                        <span>Edit</span>
                    </button>
                </Panel>
            </ReactFlow>

            <AnalysisConsole />
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