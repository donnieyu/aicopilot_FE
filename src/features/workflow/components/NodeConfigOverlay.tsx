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
import { PanelHeader } from '../../../components/PanelHeader';

interface NodeConfigOverlayProps {
    nodeId: string | null;
    onClose: () => void;
}

/**
 * [Phase 3] Node Config Overlay
 * Canvas 내부 우측 상단/하단에 떠있는 Overlay UI로 개선하여 우측 Copilot 패널을 가리지 않습니다.
 */
export function NodeConfigOverlay({ nodeId, onClose }: NodeConfigOverlayProps) {
    const nodes = useWorkflowStore((state) => state.nodes);
    const updateNodeConfiguration = useWorkflowStore((state) => state.updateNodeConfiguration);
    const getAvailableVariables = useWorkflowStore((state) => state.getAvailableVariables);
    const formDefinitions = useWorkflowStore((state) => state.formDefinitions);

    const [prevNodeId, setPrevNodeId] = useState(nodeId);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const selectedNode = nodes.find((n) => n.id === nodeId);
    const nodeType = selectedNode?.type as NodeType;
    const nodeLabel = selectedNode?.data?.label;

    const [localConfig, setLocalConfig] = useState<Partial<NodeConfiguration>>(selectedNode?.data.configuration || {});
    const [hasChanges, setHasChanges] = useState(false);

    // 노드 선택이 변경될 때마다 로컬 상태 초기화 및 동기화
    useEffect(() => {
        if (nodeId !== prevNodeId) {
            setPrevNodeId(nodeId);
            setLocalConfig(selectedNode?.data.configuration || {});
            setHasChanges(false);
            setIsPreviewOpen(false);
        } else if (selectedNode && !hasChanges) {
            // 로컬 수정이 없는 경우 외부 스토어 변경(AI 업데이트 등) 반영
            setLocalConfig(selectedNode.data.configuration || {});
        }
    }, [nodeId, prevNodeId, selectedNode, hasChanges]);

    const availableVars = nodeId ? getAvailableVariables(nodeId) : [];

    // 현재 설정된 formKey와 일치하는 폼 정의 찾기
    const linkedFormDef = useMemo(() => {
        if (!localConfig.formKey) return null;
        return formDefinitions.find(f => f.formName === localConfig.formKey);
    }, [localConfig.formKey, formDefinitions]);

    const handleChange = (key: keyof NodeConfiguration, value: any) => {
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
            {/* Overlay Container: Canvas 내부 우측에 배치하여 Copilot 패널과의 흐름 유지 */}
            <div className="absolute top-4 right-4 bottom-4 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-30 animate-in slide-in-from-right-4 fade-in duration-300 overflow-hidden">

                {/* 1. Header 영역 */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <StatusBadge type={nodeType} />
                            <span className="text-[10px] text-slate-400 font-mono truncate">ID: {nodeId}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 leading-tight truncate">{nodeLabel}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. 메인 설정 영역 */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar">

                    {/* (A) Role 설정 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={12} /> Participant (Role)
                        </label>
                        <input
                            type="text"
                            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-slate-50/50 focus:bg-white"
                            placeholder="예: 신청자, 관리자 등"
                            value={localConfig.participantRole || ''}
                            onChange={(e) => handleChange('participantRole', e.target.value)}
                        />
                    </div>

                    {/* (B) 폼 설정 (USER_TASK 전용) */}
                    {nodeType === 'USER_TASK' && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={12} /> Attached Form
                            </label>

                            <div className="relative">
                                <select
                                    className={clsx(
                                        "w-full text-sm border rounded-xl px-4 py-2.5 outline-none transition-all appearance-none bg-slate-50/50 focus:bg-white",
                                        linkedFormDef ? "border-green-300 focus:border-green-500" : "border-slate-200 focus:border-blue-400"
                                    )}
                                    value={localConfig.formKey || ''}
                                    onChange={(e) => handleChange('formKey', e.target.value)}
                                >
                                    <option value="">Select a form...</option>
                                    {formDefinitions.map((def) => (
                                        <option key={def.formName} value={def.formName}>
                                            {def.formName}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                            {/* 폼 미리보기 버튼 */}
                            {localConfig.formKey && (
                                <button
                                    onClick={() => linkedFormDef && setIsPreviewOpen(true)}
                                    className={clsx(
                                        "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                        linkedFormDef
                                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                                            : "bg-amber-50 text-amber-600 border border-amber-100 border-dashed"
                                    )}
                                >
                                    {linkedFormDef ? (
                                        <>
                                            <Eye size={14} /> Preview Attached Form
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={14} /> Form Not Defined
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* (C) 데이터 컨텍스트 표시 */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Database size={12} /> Available Data
                            </h4>
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {availableVars.length} Variables
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {availableVars.length > 0 ? availableVars.map((v) => (
                                <div key={v.id} className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                                    <span className="font-mono font-bold text-slate-600 truncate group-hover:text-blue-600">{v.alias}</span>
                                    <span className="text-[9px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">
                                        {v.type}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-slate-400 italic text-center py-2">상위 노드에서 생성된 변수가 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Footer 영역 */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={clsx(
                            "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg",
                            hasChanges
                                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        <Save size={16} />
                        {hasChanges ? 'Save Changes' : 'No Changes'}
                    </button>
                </div>
            </div>

            {/* 폼 미리보기 모달 (포털 형태로 렌더링) */}
            {isPreviewOpen && linkedFormDef && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <PanelHeader
                            title="Form Preview"
                            subTitle="UI 구성을 미리 확인합니다."
                            icon={FileText}
                            onClose={() => setIsPreviewOpen(false)}
                        />
                        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
                            <FormRenderer definition={linkedFormDef} readOnly={true} />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
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