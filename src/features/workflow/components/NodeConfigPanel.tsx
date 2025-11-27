import { useState, useMemo } from 'react';
import { X, Save, Database, User, Server, GitFork, FileText, CheckSquare, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { NodeConfiguration, NodeType } from '../../../types/workflow';

interface NodeConfigPanelProps {
    nodeId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onTriggerSuggestion: () => void; // (사용되지 않음 - UI에서 제거됨)
}

export function NodeConfigPanel({ nodeId, isOpen, onClose }: NodeConfigPanelProps) {
    const nodes = useWorkflowStore((state) => state.nodes);
    const updateNodeConfiguration = useWorkflowStore((state) => state.updateNodeConfiguration);
    const getAvailableVariables = useWorkflowStore((state) => state.getAvailableVariables);
    const dataEntities = useWorkflowStore((state) => state.dataEntities); // 전체 데이터 풀 확인용

    // [Fix] Props 변경 감지를 위한 이전 ID 추적 상태
    const [prevNodeId, setPrevNodeId] = useState(nodeId);

    // 선택된 노드 정보
    const selectedNode = nodes.find((n) => n.id === nodeId);
    const nodeType = selectedNode?.type as NodeType;
    const nodeLabel = selectedNode?.data?.label;

    // [Fix] Node ID 변경 시 로컬 상태 초기화 (Render Phase Update pattern)
    // useEffect 대신 이 패턴을 사용하여 불필요한 effect 실행 경고 해결
    const [localConfig, setLocalConfig] = useState<Partial<NodeConfiguration>>(selectedNode?.data.configuration || {});
    const [hasChanges, setHasChanges] = useState(false);

    if (nodeId !== prevNodeId) {
        setPrevNodeId(nodeId);
        setLocalConfig(selectedNode?.data.configuration || {});
        setHasChanges(false);
    }

    // [Smart Binding] 사용 가능한 변수 (이전 단계 데이터)
    const availableVars = nodeId ? getAvailableVariables(nodeId) : [];

    // [New] 검토 가능한(Reviewable) 상위 노드 목록 계산
    // 현재 노드보다 위쪽에 있는 UserTask 중 'Input' 성격인 것들
    const reviewableNodes = useMemo(() => {
        if (!nodeId) return [];
        // 실제로는 Graph Traversal로 상위 노드를 찾아야 하지만,
        // 여기서는 availableVars의 sourceNodeId를 기반으로 유니크한 노드 목록을 추출합니다.
        const sourceIds = Array.from(new Set(availableVars.map(v => v.sourceNodeId).filter(Boolean)));
        return nodes.filter(n => sourceIds.includes(n.id));
    }, [availableVars, nodes, nodeId]);

    // [Fix] any 타입을 구체적인 타입으로 변경
    const handleChange = (key: keyof NodeConfiguration, value: NodeConfiguration[keyof NodeConfiguration]) => {
        setLocalConfig((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    // [Logic] Task Behavior 전환 (Input <-> Review)
    const handleBehaviorChange = (behavior: 'INPUT' | 'REVIEW') => {
        const isApproval = behavior === 'REVIEW';
        setLocalConfig(prev => ({
            ...prev,
            isApproval,
            // Review 모드로 가면 formKey는 불필요할 수 있으나, 보통 검토용 폼도 필요하므로 유지하거나
            // 'reviewTargetNodeId' 같은 새로운 필드를 설정해야 함.
            // 여기서는 예시로 formKey를 비우지 않음.
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        if (nodeId) {
            updateNodeConfiguration(nodeId, localConfig);
            setHasChanges(false);
        }
    };

    if (!selectedNode) return null;

    // 현재 모드 판별
    const currentBehavior = localConfig.isApproval ? 'REVIEW' : 'INPUT';

    return (
        <div
            className={clsx(
                "fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* 1. Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-white">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={clsx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                            nodeType === 'USER_TASK' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                nodeType === 'SERVICE_TASK' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                                    "bg-orange-50 text-orange-600 border border-orange-100"
                        )}>
                            {nodeType?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {nodeId}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{nodeLabel}</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* 2. Configuration Form */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">

                {/* (A) Common Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                            <User size={14} /> Participant (Role)
                        </label>
                        <input
                            type="text"
                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50 focus:bg-white"
                            placeholder="e.g. Employee, Manager"
                            value={localConfig.participantRole || ''}
                            onChange={(e) => handleChange('participantRole', e.target.value)}
                        />
                    </div>
                </div>

                {/* (B) User Task Logic (Input vs Review) */}
                {nodeType === 'USER_TASK' && (
                    <div className="space-y-6">
                        {/* 1. Behavior Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Task Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleBehaviorChange('INPUT')}
                                    className={clsx(
                                        "flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all",
                                        currentBehavior === 'INPUT'
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                    )}
                                >
                                    <FileText size={20} />
                                    <span className="text-xs font-bold">Data Input</span>
                                </button>
                                <button
                                    onClick={() => handleBehaviorChange('REVIEW')}
                                    className={clsx(
                                        "flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all",
                                        currentBehavior === 'REVIEW'
                                            ? "border-orange-500 bg-orange-50 text-orange-700"
                                            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                    )}
                                >
                                    <CheckSquare size={20} />
                                    <span className="text-xs font-bold">Review</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed px-1">
                                {currentBehavior === 'INPUT'
                                    ? "사용자가 새로운 데이터를 입력하는 양식(Form)을 제공합니다. 이 노드는 데이터의 '생성자(Source)'가 됩니다."
                                    : "이전 단계의 데이터를 검토하고 승인/반려합니다. 데이터의 '소비자(Consumer)'가 됩니다."
                                }
                            </p>
                        </div>

                        {/* 2. Detailed Config based on Behavior */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                            {currentBehavior === 'INPUT' ? (
                                // [INPUT MODE] Form Selection
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-2 block flex items-center gap-2">
                                        <FileText size={14} className="text-blue-500" />
                                        Input Form to Display
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter Form Key (e.g. vacation_request_form)"
                                        value={localConfig.formKey || ''}
                                        onChange={(e) => handleChange('formKey', e.target.value)}
                                    />
                                </div>
                            ) : (
                                // [REVIEW MODE] Source Node Selection
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-2 block flex items-center gap-2">
                                        <ArrowUpRight size={14} className="text-orange-500" />
                                        Review Target (Source Step)
                                    </label>

                                    {reviewableNodes.length > 0 ? (
                                        <select
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-orange-500 bg-white"
                                            // TODO: NodeConfiguration에 reviewTargetId 필드 추가 필요. 임시로 formKey 사용하거나 무시
                                            value={''}
                                            onChange={(e) => console.log("Set Review Target:", e.target.value)}
                                        >
                                            <option value="">Select a step to review...</option>
                                            {reviewableNodes.map(n => (
                                                <option key={n.id} value={n.id}>
                                                    {n.data.label} ({n.id})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-xs text-orange-400 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                            ⚠️ 검토할 데이터가 있는 상위 단계가 없습니다. 먼저 연결선을 확인하세요.
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <label className="text-xs font-bold text-gray-600 mb-2 block">
                                            Decision Options
                                        </label>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">Approve</span>
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">Reject</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {nodeType === 'SERVICE_TASK' && (
                    <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-5 space-y-4">
                        <h3 className="text-xs font-bold text-purple-700 uppercase flex items-center gap-2 mb-2">
                            <Server size={14} /> Service Configuration
                        </h3>
                        <div>
                            <label className="text-[10px] font-bold text-purple-400 uppercase mb-1.5 block">Template ID</label>
                            <input
                                type="text"
                                className="w-full text-sm border border-purple-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
                                value={localConfig.templateId || ''}
                                onChange={(e) => handleChange('templateId', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {nodeType === 'EXCLUSIVE_GATEWAY' && (
                    <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-5 space-y-4">
                        <h3 className="text-xs font-bold text-orange-700 uppercase flex items-center gap-2 mb-2">
                            <GitFork size={14} /> Routing Logic
                        </h3>
                        <p className="text-xs text-orange-600/80 leading-relaxed">
                            분기 조건은 캔버스에서 연결선(Edge)을 선택하여 설정합니다.<br/>
                            이곳에서는 기본 설정만 관리합니다.
                        </p>
                    </div>
                )}

                {/* (C) Data Context Visualization */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Database size={16} className="text-blue-500" />
                            Data Context
                        </h3>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {availableVars.length} Variables
                        </span>
                    </div>

                    <div className="space-y-2">
                        {availableVars.length > 0 ? (
                            availableVars.map((v) => (
                                <div key={v.id} className="flex items-start gap-3 text-xs bg-white border border-gray-200 p-3 rounded-xl hover:border-blue-400 transition-all group">
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-bold text-gray-700 font-mono truncate">{v.alias}</span>
                                            <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase border border-gray-100">
                                                {v.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 truncate">
                                            Source: <span className="font-mono text-gray-500">{v.sourceNodeId}</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-xs text-gray-400">No upstream data available.</p>
                                {dataEntities.length === 0 && (
                                    <p className="text-[10px] text-red-400 mt-1">
                                        (Global Data Entities가 비어있습니다. App.tsx를 확인하세요.)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 3. Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-white">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                        "w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all transform active:scale-[0.98]",
                        hasChanges
                            ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                >
                    <Save size={18} />
                    {hasChanges ? 'Save Changes' : 'No Changes'}
                </button>
            </div>
        </div>
    );
}