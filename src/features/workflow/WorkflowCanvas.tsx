import { useCallback, useState } from 'react'; // [Change] Import useState
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel // [New] Import Panel for Lock Toggle
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
import { Lock, Unlock } from 'lucide-react'; // [New] Icons

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

    // [New] Canvas Interaction Lock State (Default: Locked)
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

                // [New] Conditional Interactivity Props
                nodesDraggable={!isLocked}
                nodesConnectable={!isLocked}
                elementsSelectable={true} // Allow selection for clicking, but drag/connect is controlled
                panOnDrag={true} // Always allow panning
                zoomOnScroll={true} // Always allow zooming
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

                {/* [New] Lock Toggle Button */}
                <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-md border border-slate-100">
                    <button
                        onClick={() => setIsLocked(!isLocked)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                        title={isLocked ? "Unlock Canvas to Edit" : "Lock Canvas"}
                    >
                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        <span>{isLocked ? "Locked" : "Editing"}</span>
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