import { useState, useMemo, useEffect } from 'react';
import {
    X,
    Sparkles,
    PenTool,
    LayoutTemplate,
    ArrowRight,
    Loader2,
    Link as LinkIcon,
    AlertCircle,
    CheckCircle2,
    Plus,
    ArrowLeftRight,
    Database,
    ChevronDown,
    Save
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../../store/useWorkflowStore';
import type { FormDefinitions, FormField, DataEntity, DataEntityType } from '../../../../types/workflow';
import { suggestFormDefinition } from '../../../../api/workflow';
import { AxiosError } from 'axios';

interface CreateFormModalProps {
    onClose: () => void;
}

type Tab = 'AI' | 'MANUAL';

export function CreateFormModal({ onClose }: CreateFormModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('AI');
    const [isLoading, setIsLoading] = useState(false);

    // Form Inputs
    const [prompt, setPrompt] = useState('');
    const [formName, setFormName] = useState('');
    const [description, setDescription] = useState('');

    // Generated Form State (Review Stage)
    const [generatedForm, setGeneratedForm] = useState<FormDefinitions | null>(null);

    const addFormDefinition = useWorkflowStore((state) => state.addFormDefinition);
    const dataEntities = useWorkflowStore((state) => state.dataEntities);

    // AI 폼 생성 핸들러
    const handleAiGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);

        try {
            const form = await suggestFormDefinition(prompt);
            setGeneratedForm(form);
        } catch (error: unknown) {
            console.error("Failed to generate form:", error);

            let errorMsg = "Unknown error occurred.";

            if (error instanceof AxiosError) {
                if (error.code === 'ECONNABORTED') {
                    errorMsg = "Generation timed out. Please try a simpler request.";
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const responseData = error.response?.data as any;
                    errorMsg = responseData?.message || error.message || "Unknown error occurred.";
                }
            } else if (error instanceof Error) {
                errorMsg = error.message;
            }

            alert(`Failed to generate form: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSave = () => {
        if (generatedForm) {
            addFormDefinition(generatedForm);
            onClose();
        }
    };

    const handleManualCreate = () => {
        if (!formName) return;
        const newForm: FormDefinitions = {
            formName: formName,
            formDescription: description || 'Manually created form.',
            fieldGroups: []
        };
        addFormDefinition(newForm);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative max-h-[85vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <LayoutTemplate size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">
                            {generatedForm ? 'Smart Data Linking' : 'Create New Form'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                {!generatedForm ? (
                    <>
                        <div className="flex border-b border-slate-100">
                            <button
                                onClick={() => setActiveTab('AI')}
                                className={clsx("flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all", activeTab === 'AI' ? "border-indigo-500 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                            >
                                <Sparkles size={16} /> AI Architect
                            </button>
                            <button
                                onClick={() => setActiveTab('MANUAL')}
                                className={clsx("flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all", activeTab === 'MANUAL' ? "border-pink-500 text-pink-600 bg-pink-50/50" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                            >
                                <PenTool size={16} /> Manual Design
                            </button>
                        </div>

                        <div className="p-6 bg-slate-50/50 min-h-[300px]">
                            {activeTab === 'AI' ? (
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                        <label className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 block">Describe requirements</label>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="e.g. Employee onboarding form with personal info, contact details, and document upload."
                                            className="w-full h-32 text-sm border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAiGenerate}
                                        disabled={!prompt || isLoading}
                                        className={clsx("w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all", isLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700")}
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        {isLoading ? "Generating..." : "Generate Draft"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Form Name (Key)</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="e.g. Vendor_Registration_Form"
                                            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Briefly describe the purpose of this form..."
                                            className="w-full h-24 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-white resize-none"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button onClick={handleManualCreate} disabled={!formName} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors disabled:bg-slate-300">Create Blank Form</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Review & Linking Stage
                    <div className="flex flex-col h-[500px]">
                        <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-start gap-3">
                            <Sparkles size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-blue-800 font-medium">AI has analyzed your data model.</p>
                                <p className="text-[10px] text-blue-600 mt-0.5">Existing entities were automatically linked. Please review suggestions for unconnected fields.</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                            {generatedForm.fieldGroups.map(group => (
                                <div key={group.id} className="space-y-2">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                                        {group.name}
                                    </h5>
                                    {group.fields.map(field => (
                                        <SmartFieldLinker
                                            key={field.id}
                                            field={field}
                                            dataEntities={dataEntities}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button onClick={() => setGeneratedForm(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Back</button>
                            <button onClick={handleConfirmSave} className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-indigo-700">
                                Confirm & Save Form
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// [Updated] 지능형 필드 연결 컴포넌트 with Inline Creation
function SmartFieldLinker({ field, dataEntities }: { field: FormField, dataEntities: DataEntity[] }) {
    const addDataEntity = useWorkflowStore((state) => state.addDataEntity);

    // 1. Initial Match Logic
    const exactMatch = useMemo(() =>
            dataEntities.find(e => e.alias === field.entityAlias),
        [dataEntities, field.entityAlias]);

    const suggestedMatch = useMemo(() =>
            !exactMatch ? dataEntities.find(e =>
                e.alias.toLowerCase().includes(field.entityAlias.toLowerCase()) ||
                field.entityAlias.toLowerCase().includes(e.alias.toLowerCase())
            ) : null,
        [dataEntities, field.entityAlias, exactMatch]);

    const [status, setStatus] = useState<'LINKED' | 'SUGGESTED' | 'NEW' | 'CREATING'>(
        exactMatch ? 'LINKED' : suggestedMatch ? 'SUGGESTED' : 'NEW'
    );
    const [linkedEntity, setLinkedEntity] = useState<DataEntity | undefined>(exactMatch || suggestedMatch);
    const [isSelecting, setIsSelecting] = useState(false);

    // [New] Creation Form State
    const [newEntityAlias, setNewEntityAlias] = useState(field.entityAlias);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [newEntityLabel, setNewEntityLabel] = useState(field.label);
    const [newEntityType, setNewEntityType] = useState<DataEntityType>('string'); // Default type

    // Handle Inline Creation
    const handleCreateNew = () => {
        const newEntity: DataEntity = {
            id: `entity_${Date.now()}`,
            alias: newEntityAlias,
            label: newEntityLabel, // Use state instead of prop
            type: newEntityType,
            description: `Auto-generated for field: ${field.label}`,
            required: field.required,
            isPrimaryKey: false,
            // Add other required fields with defaults
            lookupData: { name: "", description: "", lookupItems: [] },
            sourceNodeId: "manual_creation", // Placeholder
            maxLength: 255,
            pattern: "",
            requireTrue: false
        };

        addDataEntity(newEntity);
        setLinkedEntity(newEntity);
        setStatus('LINKED');
        setIsSelecting(false); // Reset selection mode if active
    };

    if (status === 'CREATING') {
        return (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                        <Plus size={12} /> Create New Data Entity
                    </h5>
                    <button onClick={() => setStatus('NEW')} className="text-slate-400 hover:text-slate-600">
                        <X size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Entity Alias</label>
                        <input
                            type="text"
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                            value={newEntityAlias}
                            onChange={(e) => setNewEntityAlias(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Data Type</label>
                        <select
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 bg-white"
                            value={newEntityType}
                            onChange={(e) => setNewEntityType(e.target.value as DataEntityType)}
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Boolean</option>
                            <option value="file">File</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                    >
                        <Save size={12} /> Create & Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={clsx(
            "flex items-center justify-between p-3 rounded-lg border text-sm transition-all bg-white",
            status === 'LINKED' ? "border-green-200 shadow-sm" :
                status === 'SUGGESTED' ? "border-amber-200 ring-1 ring-amber-50" : "border-slate-200"
        )}>
            {/* Field Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={clsx(
                    "p-1.5 rounded-full flex-shrink-0",
                    status === 'LINKED' ? "bg-green-100 text-green-600" :
                        status === 'SUGGESTED' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                )}>
                    {status === 'LINKED' ? <CheckCircle2 size={14} /> :
                        status === 'SUGGESTED' ? <ArrowLeftRight size={14} /> : <Plus size={14} />}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-slate-700 text-xs truncate">{field.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        {field.entityAlias}
                        <span className="bg-slate-100 px-1 rounded text-[9px]">{field.component}</span>
                    </p>
                </div>
            </div>

            {/* Action Area */}
            <div className="flex items-center gap-2">

                {status === 'LINKED' && linkedEntity && (
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-green-600 bg-green-50 px-2 py-1.5 rounded border border-green-100 max-w-[120px]">
                            <LinkIcon size={10} className="flex-shrink-0" />
                            <span className="font-mono truncate">{linkedEntity.alias}</span>
                        </div>
                        <button
                            onClick={() => {
                                setStatus('NEW');
                                setLinkedEntity(undefined);
                                setIsSelecting(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Disconnect and change"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {status === 'SUGGESTED' && linkedEntity && (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-amber-600 font-bold">Suggestion</span>
                            <span className="text-[9px] text-slate-500 font-mono bg-slate-50 px-1 rounded border border-slate-100 max-w-[100px] truncate">
                                {linkedEntity.alias}
                            </span>
                        </div>
                        <button
                            onClick={() => setStatus('LINKED')}
                            className="p-1.5 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
                            title="Accept Suggestion"
                        >
                            <CheckCircle2 size={14} />
                        </button>
                        <button
                            onClick={() => {
                                setStatus('NEW');
                                setLinkedEntity(undefined);
                            }}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                            title="Reject"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {(status === 'NEW' || (status === 'SUGGESTED' && !linkedEntity)) && (
                    <div className="flex items-center gap-2">
                        {isSelecting ? (
                            <div className="relative">
                                <select
                                    className="text-xs border border-blue-300 rounded px-2 py-1.5 pr-6 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-[140px]"
                                    onChange={(e) => {
                                        const selected = dataEntities.find(ent => ent.id === e.target.value);
                                        if (selected) {
                                            setLinkedEntity(selected);
                                            setStatus('LINKED');
                                            setIsSelecting(false);
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select Entity...</option>
                                    {dataEntities.map(ent => (
                                        <option key={ent.id} value={ent.id}>{ent.alias}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setIsSelecting(false)}
                                    className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsSelecting(true)}
                                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded border border-transparent hover:border-slate-200 transition-all"
                                >
                                    <Database size={10} />
                                    <span>Select</span>
                                </button>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <button
                                    onClick={() => setStatus('CREATING')} // [New] Switch to creation mode
                                    className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-1.5 rounded border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all"
                                    title="Will create a new entity"
                                >
                                    <Plus size={10} />
                                    <span>Create New</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}