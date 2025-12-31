import { useState, useMemo, useEffect } from 'react';
import {
    Save,
    Database,
    User,
    FileText,
    CheckSquare,
    Eye,
    AlertTriangle,
    ChevronDown,
    X
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { NodeConfiguration, NodeType } from '../../../types/workflow';
import { FormRenderer } from './forms/FormRenderer';
import { StatusBadge } from '../../../components/StatusBadge';

interface NodeConfigOverlayProps {
    nodeId: string | null;
    onClose: () => void;
}

/**
 * NodeConfigOverlay
 * [Phase 1.1] 기존 사이드 패널에서 캔버스 위 플로팅 오버레이로 리팩토링된 컴포넌트입니다.
 * 컴파일 오류 해결을 위해 파일 확장자를 .tsx로 지정하고 경로 참조를 확인했습니다.
 */
export function NodeConfigOverlay({ nodeId, onClose }: NodeConfigOverlayProps) {
    const nodes = useWorkflowStore((state) => state.nodes);
    const updateNodeConfiguration = useWorkflowStore((state) => state.updateNodeConfiguration);
    const getAvailableVariables = useWorkflowStore((state) => state.getAvailableVariables);
    const formDefinitions = useWorkflowStore((state) => state.formDefinitions);

    const selectedNode = nodes.find((n) => n.id === nodeId);
    const nodeType = selectedNode?.type as NodeType;
    const nodeLabel = selectedNode?.data?.label;

    const [localConfig, setLocalConfig] = useState<Partial<NodeConfiguration>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // 노드 변경 시 로컬 상태 초기화
    useEffect(() => {
        if (selectedNode) {
            setLocalConfig(selectedNode.data.configuration || {});
            setHasChanges(false);
            setIsPreviewOpen(false);
        }
    }, [nodeId, selectedNode]);

    const availableVars = useMemo(() => nodeId ? getAvailableVariables(nodeId) : [], [nodeId, getAvailableVariables]);

    const linkedFormDef = useMemo(() => {
        if (!localConfig.formKey) return null;
        return formDefinitions.find(f => f.formName === localConfig.formKey);
    }, [localConfig.formKey, formDefinitions]);

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
        <>
            <div
                className={clsx(
                    "absolute top-4 right-4 w-[380px] max-h-[calc(100%-2rem)] bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200 rounded-2xl z-40 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4",
                )}
            >
                {/* Header: 오버레이 느낌을 주기 위해 더 콤팩트하게 구성 */}
                <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <StatusBadge type={nodeType} />
                            <span className="text-[10px] text-slate-400 font-mono">ID: {nodeId}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate pr-2">{nodeLabel}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                    {/* Role Configuration */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <User size={12} /> Participant Role
                        </label>
                        <input
                            type="text"
                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all bg-white"
                            placeholder="e.g. Requester, Reviewer"
                            value={localConfig.participantRole || ''}
                            onChange={(e) => handleChange('participantRole', e.target.value)}
                        />
                    </div>

                    {/* Form Configuration (USER_TASK Only) */}
                    {nodeType === 'USER_TASK' && (
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={12} /> Data Collection Form
                            </label>

                            <div className="relative">
                                <select
                                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all appearance-none bg-white"
                                    value={localConfig.formKey || ''}
                                    onChange={(e) => handleChange('formKey', e.target.value)}
                                >
                                    <option value="" disabled>Select a form...</option>
                                    {formDefinitions.map((def) => (
                                        <option key={def.formName} value={def.formName}>{def.formName}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {localConfig.formKey && (
                                <div
                                    onClick={() => linkedFormDef && setIsPreviewOpen(true)}
                                    className={clsx(
                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                        linkedFormDef ? "bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50" : "bg-amber-50 border-amber-100"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={clsx("p-1.5 rounded-lg", linkedFormDef ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600")}>
                                            {linkedFormDef ? <CheckSquare size={14} /> : <AlertTriangle size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-700 leading-none mb-1">{localConfig.formKey}</p>
                                            <p className="text-[9px] text-slate-500">
                                                {linkedFormDef ? "Preview available" : "Not generated yet"}
                                            </p>
                                        </div>
                                    </div>
                                    {linkedFormDef && <Eye size={14} className="text-slate-400 group-hover:text-indigo-500" />}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upstream Data Context */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Database size={12} /> Data Context
                            </h4>
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                {availableVars.length} Available
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {availableVars.length > 0 ? (
                                availableVars.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg group hover:border-indigo-200 transition-colors">
                                        <span className="text-[11px] font-mono font-bold text-slate-600 truncate">{v.alias}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{v.type}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-slate-400 italic text-center py-2">No variables found from upstream.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={clsx(
                            "w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all",
                            hasChanges
                                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        <Save size={14} />
                        {hasChanges ? 'Save Settings' : 'No Changes'}
                    </button>
                </div>
            </div>

            {/* FORM PREVIEW MODAL */}
            {isPreviewOpen && linkedFormDef && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Form Preview</h4>
                                <p className="text-[10px] text-slate-500">Previewing: {linkedFormDef.formName}</p>
                            </div>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white max-h-[70vh]">
                            <FormRenderer definition={linkedFormDef} />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}