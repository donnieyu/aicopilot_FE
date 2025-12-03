import { useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import type { Node, NodeTypes } from 'reactflow';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import {
    UserTaskNode,
    ServiceTaskNode,
    GatewayNode,
    StartNode,
    EndNode,
    SwimlaneNode
} from './nodes/CustomNodes';
import { AnalysisConsole } from './components/AnalysisConsole';
import 'reactflow/dist/style.css';
import { Lock, Unlock } from 'lucide-react';
import clsx from 'clsx';

const nodeTypes: NodeTypes = {
    USER_TASK: UserTaskNode,
    SERVICE_TASK: ServiceTaskNode,
    EXCLUSIVE_GATEWAY: GatewayNode,
    START: StartNode,
    END: EndNode,
    SWIMLANE: SwimlaneNode,
};

interface WorkflowCanvasProps {
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

const FlowContent = ({ onNodeClick }: WorkflowCanvasProps) => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

    // Canvas Interaction Lock State
    const [isLocked, setIsLocked] = useState(true);

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
                fitView
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="bottom-right"
                snapToGrid={true}
                snapGrid={[15, 15]}
                onNodeClick={handleNodeClick}

                // Conditional Interactivity Props
                nodesDraggable={!isLocked}
                nodesConnectable={!isLocked}
                elementsSelectable={true}
                panOnDrag={true}
                zoomOnScroll={true}
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

                {/* [Changed] Lock Toggle Button Moved to Top-Center */}
                <Panel position="top-center" className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-slate-200 mt-4 flex gap-1">
                    <button
                        onClick={() => setIsLocked(true)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            isLocked ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                        )}
                        title="View Mode (Locked)"
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
                        title="Edit Mode (Unlocked)"
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