import { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import type { Node, NodeTypes } from 'reactflow'; // [Fix] import type 사용
import { useWorkflowStore } from '../../store/useWorkflowStore';
import {
    UserTaskNode,
    ServiceTaskNode,
    GatewayNode,
    StartNode,
    EndNode,
    SwimlaneNode
} from './nodes/CustomNodes';
import 'reactflow/dist/style.css';

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

export const WorkflowCanvas = ({ onNodeClick }: WorkflowCanvasProps) => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
            onNodeClick(event, node);
        }
    }, [onNodeClick]);

    return (
        <div className="w-full h-full bg-white">
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
            </ReactFlow>
        </div>
    );
};