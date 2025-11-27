import { useState, useEffect } from 'react';
import { X, Save, Sparkles, Database, User, Server, GitFork, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { NodeConfiguration, NodeType } from '../../../types/workflow';

interface NodeConfigPanelProps {
    nodeId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onTriggerSuggestion: () => void; // AI 제안 수동 트리거
}

export function NodeConfigPanel({ nodeId, isOpen, onClose, onTriggerSuggestion }: NodeConfigPanelProps) {
    const nodes = useWorkflowStore((state) => state.nodes);
    const updateNodeConfiguration = useWorkflowStore((state) => state.updateNodeConfiguration);
    const getAvailableVariables = useWorkflowStore((state) => state.getAvailableVariables);

    const [localConfig, setLocalConfig] = useState<Partial<NodeConfiguration>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // 선택된 노드 찾기
    const selectedNode = nodes.find((n) => n.id === nodeId);
    const nodeType = selectedNode?.type as NodeType;
    const nodeLabel = selectedNode?.data?.label;

    // [Smart Binding] 현재 노드 시점에서 사용 가능한 변수 조회
    const availableVars = nodeId ? getAvailableVariables(nodeId) : [];

    // [Fix 1] useEffect 의존성을 selectedNode 객체 전체가 아닌 'ID'로 한정
    // 노드 선택이 변경되었을 때만 로컬 폼 상태를 초기화합니다.
    useEffect(() => {
        if (selectedNode) {
            setLocalConfig(selectedNode.data.configuration || {});
            setHasChanges(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode?.id]);

    // [Fix 2] 'any' 대신 NodeConfiguration의 값 타입으로 명시
    const handleChange = (key: keyof NodeConfiguration, value: NodeConfiguration[keyof NodeConfiguration]) => {
        setLocalConfig((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        if (nodeId) {
            updateNodeConfiguration(nodeId, localConfig);
            setHasChanges(false);
        }
    };

    if (!selectedNode) return null;

    return (
        <div
            className={clsx(
                "fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* 1. Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            nodeType === 'USER_TASK' ? "bg-blue-100 text-blue-600" :
                                nodeType === 'SERVICE_TASK' ? "bg-purple-100 text-purple-600" :
                                    "bg-orange-100 text-orange-600"
                        )}>
                            {nodeType?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{nodeId}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{nodeLabel}</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            {/* 2. AI Architect Nudge Area */}
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700">
                        <Sparkles size={16} className="fill-blue-200" />
                        <span className="text-sm font-bold">Co-Architect</span>
                    </div>
                    <button
                        onClick={onTriggerSuggestion}
                        className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-md font-semibold hover:bg-blue-50 shadow-sm transition-all flex items-center gap-1.5"
                    >
                        다음 단계 제안받기 <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* 3. Configuration Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* (A) Common Fields */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        참여자 / 담당자
                    </label>
                    <input
                        type="text"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="예: Manager, System"
                        value={localConfig.participantRole || ''}
                        onChange={(e) => handleChange('participantRole', e.target.value)}
                    />
                </div>

                {/* (B) Type Specific Fields */}
                {nodeType === 'USER_TASK' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">User Task Settings</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">승인/반려 버튼 표시</span>
                            <input
                                type="checkbox"
                                className="toggle-checkbox"
                                checked={localConfig.isApproval || false}
                                onChange={(e) => handleChange('isApproval', e.target.checked)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Form Key (Link)</label>
                            <input
                                type="text"
                                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                                value={localConfig.formKey || ''}
                                onChange={(e) => handleChange('formKey', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {nodeType === 'SERVICE_TASK' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                            <Server size={14} /> Service Settings
                        </h3>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Template ID</label>
                            <input
                                type="text"
                                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                                value={localConfig.templateId || ''}
                                onChange={(e) => handleChange('templateId', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Subject (Email)</label>
                            <input
                                type="text"
                                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                                value={localConfig.subject || ''}
                                onChange={(e) => handleChange('subject', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {nodeType === 'EXCLUSIVE_GATEWAY' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                            <GitFork size={14} /> Branching Logic
                        </h3>
                        <p className="text-xs text-gray-500">
                            조건부 분기는 노드 연결선(Edge)에서 설정합니다. 이곳에서는 기본 경로를 설정하세요.
                        </p>
                    </div>
                )}

                {/* (C) Smart Variable Context */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Database size={16} className="text-gray-400" />
                        Available Variables (Context)
                    </h3>

                    {availableVars.length > 0 ? (
                        <div className="space-y-2">
                            {availableVars.map((v) => (
                                <div key={v.id} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 p-2 rounded hover:border-blue-300 transition-colors cursor-help group" title={v.description}>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        <span className="font-mono text-slate-700">{v.alias}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500">{v.type}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 italic p-3 text-center bg-gray-50 rounded-lg">
                            이전 단계에서 생성된 변수가 없습니다.
                        </div>
                    )}
                </div>

            </div>

            {/* 4. Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={clsx(
                        "w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all",
                        hasChanges
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
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