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

    // Sync state when selection changes
    useEffect(() => {
        if (nodeId !== prevNodeId) {
            setPrevNodeId(nodeId);
            setLocalConfig(selectedNode?.data.configuration || {});
            setHasChanges(false);
            setIsPreviewOpen(false);
        } else if (selectedNode && !hasChanges) {
            // Update if store changes externally (e.g. AI update) and no local edits
            setLocalConfig(selectedNode.data.configuration || {});
        }
    }, [nodeId, prevNodeId, selectedNode, hasChanges]);

    const availableVars = nodeId ? getAvailableVariables(nodeId) : [];

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
            {/* Overlay Container: Canvas 내부 우측에 떠있는 형태 */}
            <div className="absolute top-4 right-4 bottom-4 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-30 animate-in slide-in-from-right-4 fade-in duration-300">

                {/* 1. Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 rounded-t-2xl">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <StatusBadge type={nodeType} />
                            <span className="text-[10px] text-slate-400 font-mono">ID: {nodeId}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{nodeLabel}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Content */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar">

                    {/* (A) Role Config */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={14} /> Participant (Role)
                        </label>
                        <input
                            type="text"
                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-slate-50 focus:bg-white"
                            placeholder="e.g. Employee, Manager"
                            value={localConfig.participantRole || ''}
                            onChange={(e) => handleChange('participantRole', e.target.value)}
                        />
                    </div>

                    {/* (B) Form Configuration (User Task Only) */}
                    {nodeType === 'USER_TASK' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={14} /> Attached Form
                            </label>

                            <div className="space-y-2">
                                <div className="relative">
                                    <select
                                        className={clsx(
                                            "w-full text-sm border rounded-lg px-3 py-2.5 focus:ring-1 transition-all appearance-none bg-white",
                                            linkedFormDef
                                                ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                        )}
                                        value={localConfig.formKey || ''}
                                        onChange={(e) => handleChange('formKey', e.target.value)}
                                    >
                                        <option value="" disabled>Select a form...</option>
                                        {formDefinitions.map((def) => (
                                            <option key={def.formName} value={def.formName}>
                                                {def.formName}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronDown size={16} className="text-slate-400" />
                                    </div>
                                </div>

                                {/* Form Preview Card */}
                                {localConfig.formKey && (
                                    <div
                                        onClick={() => linkedFormDef && setIsPreviewOpen(true)}
                                        className={clsx(
                                            "rounded-xl border p-3 transition-all group relative overflow-hidden cursor-pointer",
                                            linkedFormDef
                                                ? "bg-white border-green-200 shadow-sm hover:border-green-300"
                                                : "bg-amber-50 border-amber-200 border-dashed"
                                        )}
                                    >
                                        {linkedFormDef ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                                                        <CheckSquare size={14} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">{linkedFormDef.formName}</h4>
                                                        <span className="text-[10px] text-slate-500">{linkedFormDef.fieldGroups.length} Groups</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg group-hover:bg-green-100 transition-colors flex items-center gap-1">
                                                    <Eye size={12} /> Preview
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-600 text-xs">
                                                <AlertTriangle size={14} />
                                                <span>Form definition not found</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* (C) Data Context */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Database size={14} /> Upstream Data
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {availableVars.length} Vars
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {availableVars.length > 0 ? availableVars.map((v) => (
                                <div key={v.id} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                    <span className="font-bold text-slate-700 font-mono truncate">{v.alias}</span>
                                    <span className="text-[9px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                        {v.type}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-slate-400 italic">No upstream data available.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Footer */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={clsx(
                            "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                            hasChanges
                                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        <Save size={16} />
                        {hasChanges ? 'Save Changes' : 'No Changes'}
                    </button>
                </div>
            </div>

            {/* FORM PREVIEW MODAL (Global Level) */}
            {isPreviewOpen && linkedFormDef && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <PanelHeader
                            title="Form Preview"
                            subTitle="User Interface Mockup"
                            icon={FileText}
                            iconClassName="bg-blue-100 text-blue-600"
                            onClose={() => setIsPreviewOpen(false)}
                        />
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                            <FormRenderer definition={linkedFormDef} />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setIsPreviewOpen(false)} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}