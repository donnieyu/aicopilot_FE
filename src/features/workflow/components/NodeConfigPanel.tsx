import { useState, useMemo } from 'react';
import {
    X,
    Save,
    Database,
    User,
    // [Fix] Unused imports removed: Server, GitFork, ArrowUpRight
    FileText,
    CheckSquare,
    Eye,
    // [Fix] Unused Link as LinkIcon removed
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
// [Fix] Unused 'FormDefinitions' removed from named imports
import type { NodeConfiguration, NodeType } from '../../../types/workflow';
import { FormRenderer } from './forms/FormRenderer';

interface NodeConfigPanelProps {
    nodeId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onTriggerSuggestion: () => void;
}

export function NodeConfigPanel({ nodeId, isOpen, onClose }: NodeConfigPanelProps) {
    const nodes = useWorkflowStore((state) => state.nodes);
    const updateNodeConfiguration = useWorkflowStore((state) => state.updateNodeConfiguration);
    const getAvailableVariables = useWorkflowStore((state) => state.getAvailableVariables);
    // [Fix] Unused 'dataEntities' removed
    const formDefinitions = useWorkflowStore((state) => state.formDefinitions);

    const [prevNodeId, setPrevNodeId] = useState(nodeId);

    // Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const selectedNode = nodes.find((n) => n.id === nodeId);
    const nodeType = selectedNode?.type as NodeType;
    const nodeLabel = selectedNode?.data?.label;

    const [localConfig, setLocalConfig] = useState<Partial<NodeConfiguration>>(selectedNode?.data.configuration || {});
    const [hasChanges, setHasChanges] = useState(false);

    if (nodeId !== prevNodeId) {
        setPrevNodeId(nodeId);
        setLocalConfig(selectedNode?.data.configuration || {});
        setHasChanges(false);
        setIsPreviewOpen(false);
    }

    const availableVars = nodeId ? getAvailableVariables(nodeId) : [];

    // Find linked form definition
    const linkedFormDef = useMemo(() => {
        if (!localConfig.formKey) return null;
        return formDefinitions.find(f => f.formName === localConfig.formKey);
    }, [localConfig.formKey, formDefinitions]);

    // [Fix] Explicit 'any' replaced with specific type lookup
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

                {/* 2. Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">

                    {/* (A) Role Config */}
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

                    {/* (B) Form Configuration */}
                    {nodeType === 'USER_TASK' && (
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
                                <FileText size={14} /> Attached Form
                            </label>

                            <div className="space-y-2">
                                <div className="relative">
                                    <select
                                        className={clsx(
                                            "w-full text-sm border rounded-lg px-3 py-2.5 focus:ring-1 transition-all appearance-none bg-white",
                                            linkedFormDef
                                                ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                                                : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                                        {!formDefinitions.find(f => f.formName === localConfig.formKey) && localConfig.formKey && (
                                            <option value={localConfig.formKey}>{localConfig.formKey} (Not Found)</option>
                                        )}
                                    </select>

                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </div>
                                </div>

                                {/* Smart Form Card / Preview Trigger */}
                                {localConfig.formKey && (
                                    <div
                                        onClick={() => linkedFormDef && setIsPreviewOpen(true)}
                                        className={clsx(
                                            "rounded-xl border p-4 transition-all group relative overflow-hidden",
                                            linkedFormDef
                                                ? "bg-white border-green-200 shadow-sm hover:shadow-md cursor-pointer hover:border-green-300"
                                                : "bg-amber-50 border-amber-200 border-dashed cursor-not-allowed"
                                        )}
                                    >
                                        {linkedFormDef ? (
                                            <>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                                                            <CheckSquare size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800">{linkedFormDef.formName}</h4>
                                                            <span className="text-[10px] text-slate-500">{linkedFormDef.fieldGroups.length} Groups, {linkedFormDef.fieldGroups.reduce((acc, g) => acc + g.fields.length, 0)} Fields</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg group-hover:bg-green-100 transition-colors w-full justify-center mt-2">
                                                    <Eye size={14} />
                                                    Preview Actual Form
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3 text-amber-600">
                                                <AlertTriangle size={20} />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold">Form definition not found</p>
                                                    <p className="text-[10px] opacity-80">
                                                        Selected form '{localConfig.formKey}' has not been generated yet.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* (C) Data Context */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Database size={16} className="text-blue-500" />
                                Upstream Data
                            </h3>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {availableVars.length} Variables
                            </span>
                        </div>
                        <div className="space-y-2">
                            {availableVars.map((v) => (
                                <div key={v.id} className="flex items-start gap-3 text-xs bg-white border border-gray-200 p-3 rounded-xl">
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-bold text-gray-700 font-mono truncate">{v.alias}</span>
                                            <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase border border-gray-100">
                                                {v.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* 3. Footer */}
                <div className="p-6 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={clsx(
                            "w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                            hasChanges
                                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        <Save size={18} />
                        {hasChanges ? 'Save Changes' : 'No Changes'}
                    </button>
                </div>
            </div>

            {/* FORM PREVIEW MODAL */}
            {isPreviewOpen && linkedFormDef && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Form Preview</h3>
                                    <p className="text-xs text-slate-500">This is how the user will see it.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content (Renderer) */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                            <FormRenderer definition={linkedFormDef} />
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setIsPreviewOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}