import { useState, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    ReactFlowProvider
    // [Fix] MarkerType removed (unused)
} from 'reactflow';
import {
    X,
    Wand2,
    Check,
    RotateCcw,
    Split
} from 'lucide-react';
import clsx from 'clsx';
import { useMutation } from '@tanstack/react-query';
import { AiActionButton } from '../../../components/AiActionButton';
import type { Node, Edge } from 'reactflow';
import type { AnalysisResult } from '../../../types/workflow';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
// [Fix] Use relative path instead of absolute path alias
import { fixProcessGraph } from '../../../api/workflow';
import {
    UserTaskNode,
    ServiceTaskNode,
    GatewayNode,
    StartNode,
    EndNode,
    SwimlaneNode
} from '../nodes/CustomNodes';

// Node Types (Reuse existing ones)
const nodeTypes = {
    USER_TASK: UserTaskNode,
    SERVICE_TASK: ServiceTaskNode,
    EXCLUSIVE_GATEWAY: GatewayNode,
    START: StartNode,
    END: EndNode,
    SWIMLANE: SwimlaneNode,
};

interface ErrorFixModalProps {
    isOpen: boolean;
    onClose: () => void;
    errors: AnalysisResult[];
}

export function ErrorFixModal({ isOpen, onClose, errors }: ErrorFixModalProps) {
    // Global Store Access (Read-Only Source)
    const originalNodes = useWorkflowStore((state) => state.nodes);
    const originalEdges = useWorkflowStore((state) => state.edges);
    const setGraph = useWorkflowStore((state) => state.setGraph);

    // Local Simulation State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // AI Fix State
    const [selectedError, setSelectedError] = useState<AnalysisResult | null>(null);
    const [fixedGraph, setFixedGraph] = useState<{ nodes: Node[], edges: Edge[] } | null>(null);

    // Initialize Simulation Canvas with Original Data
    useEffect(() => {
        if (isOpen) {
            setNodes(JSON.parse(JSON.stringify(originalNodes)));
            setEdges(JSON.parse(JSON.stringify(originalEdges)));
            setFixedGraph(null);

            // Set default error if none selected
            if (errors.length > 0 && !selectedError) {
                setSelectedError(errors[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // [Real API Integration]
    const { mutate: executeAutoFix, isPending: isFixing } = useMutation({
        mutationFn: async () => {
            if (!selectedError) throw new Error("No error selected");

            // Prepare Snapshot (Current Simulation State)
            const snapshot = {
                nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data, position: n.position })),
                edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
            };

            return await fixProcessGraph(snapshot, selectedError);
        },
        onSuccess: (data) => {
            if (data && data.nodes && data.edges) {
                // Update Simulation Canvas with fixed data
                setNodes(data.nodes);
                setEdges(data.edges);
                setFixedGraph({ nodes: data.nodes, edges: data.edges });
            }
        },
        onError: (error) => {
            console.error("Auto-fix failed:", error);
            alert("Failed to fix the graph. Please try again.");
        }
    });

    const handleAutoFix = () => {
        executeAutoFix();
    };

    const handleApplyFix = () => {
        if (fixedGraph) {
            // Update the main store directly
            setGraph(fixedGraph.nodes, fixedGraph.edges);
            alert("Changes applied to main canvas!");
            onClose();
        }
    };

    const handleReset = () => {
        setNodes(JSON.parse(JSON.stringify(originalNodes)));
        setEdges(JSON.parse(JSON.stringify(originalEdges)));
        setFixedGraph(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[90vw] h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">

                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800">Auto-Fix Simulator</h2>
                            <p className="text-sm text-slate-500 font-medium">Review AI suggestions before applying changes.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Error List */}
                    <div className="w-[380px] bg-slate-50 border-r border-slate-200 flex flex-col">
                        <div className="p-5 border-b border-slate-200 bg-white">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detected Issues</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-slate-800">{errors.length} Errors</span>
                                <div className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold">High Priority</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {errors.map((err, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedError(err);
                                        setFixedGraph(null);
                                        setNodes(JSON.parse(JSON.stringify(originalNodes)));
                                        setEdges(JSON.parse(JSON.stringify(originalEdges)));
                                    }}
                                    className={clsx(
                                        "w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group",
                                        selectedError === err
                                            ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-100"
                                            : "bg-white border-transparent hover:border-slate-300 shadow-sm"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={clsx(
                                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                            err.severity === 'ERROR' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {err.type}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 leading-snug mb-1">{err.message}</p>
                                    <p className="text-xs text-slate-400">{err.suggestion}</p>

                                    {selectedError === err && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Action Panel */}
                        <div className="p-5 bg-white border-t border-slate-200">
                            {selectedError ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <Wand2 size={14} className="text-indigo-500" />
                                        AI Solution
                                    </div>
                                    <p className="text-sm text-slate-600 italic">
                                        "{selectedError.suggestion}"
                                    </p>

                                    {!fixedGraph ? (
                                        <AiActionButton
                                            onClick={handleAutoFix}
                                            isLoading={isFixing}
                                            loadingText="Simulating Fix..."
                                            fullWidth={true}
                                            className="shadow-lg shadow-indigo-100"
                                        >
                                            Simulate Fix
                                        </AiActionButton>
                                    ) : (
                                        <div className="flex gap-2 animate-in slide-in-from-bottom-2 fade-in">
                                            <button
                                                onClick={handleReset}
                                                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw size={16} /> Undo
                                            </button>
                                            <button
                                                onClick={handleApplyFix}
                                                className="flex-[2] py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} /> Apply Changes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-slate-400 py-4">Select an error to see solutions.</p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Simulation Canvas */}
                    <div className="flex-1 relative bg-slate-100">
                        {/* Simulation Badge */}
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                                <Split size={14} className="text-indigo-500" />
                                <span className="text-xs font-bold text-slate-600">Simulation Environment</span>
                            </div>
                            {fixedGraph && (
                                <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 animate-in zoom-in">
                                    <Check size={14} />
                                    <span className="text-xs font-bold">Fix Simulated</span>
                                </div>
                            )}
                        </div>

                        <ReactFlowProvider>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                nodeTypes={nodeTypes}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                fitView
                                fitViewOptions={{ padding: 0.4 }}
                                nodesDraggable={false}
                                nodesConnectable={false}
                                elementsSelectable={true}
                            >
                                <Background color="#e2e8f0" gap={20} />
                                <Controls />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}