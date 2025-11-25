import ReactFlow, {
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import type { NodeTypes } from 'reactflow';
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

// 커스텀 노드 타입 매핑
const nodeTypes: NodeTypes = {
    USER_TASK: UserTaskNode,
    SERVICE_TASK: ServiceTaskNode,
    EXCLUSIVE_GATEWAY: GatewayNode,
    START: StartNode,       // [New]
    END: EndNode,           // [New]
    SWIMLANE: SwimlaneNode, // [New]
};

export const WorkflowCanvas = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

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
                // 노드 드래그 시 자석 효과 (Snap)
                snapToGrid={true}
                snapGrid={[15, 15]}
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