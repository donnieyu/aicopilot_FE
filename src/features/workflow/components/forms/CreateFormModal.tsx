import { useState } from 'react';
import {
    X,
    Sparkles,
    PenTool,
    LayoutTemplate,
    CheckCircle2,
    Plus,
    ArrowLeftRight,
    Database,
    Link as LinkIcon,
    Wand2,
    BrainCircuit,
    ChevronDown,
    Save
} from 'lucide-react';
import clsx from 'clsx';
import { useMutation } from '@tanstack/react-query';
import { useWorkflowStore } from '../../../../store/useWorkflowStore';
import type { FormDefinitions, FormField, DataEntity, DataEntityType, FormFieldComponent } from '../../../../types/workflow';
import { AiActionButton } from '../../../../components/AiActionButton';
import { suggestFormAutoDiscovery } from '../../../../api/workflow';
import { BaseModal } from '../../../../components/BaseModal'; // [New] Import BaseModal

interface CreateFormModalProps {
    onClose: () => void;
}

type Tab = 'AI' | 'MANUAL';

export function CreateFormModal({ onClose }: CreateFormModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('AI');

    // Manual Form Inputs
    const [formName, setFormName] = useState('');
    const [description, setDescription] = useState('');

    // Generated Form State
    const [generatedForm, setGeneratedForm] = useState<FormDefinitions | null>(null);

    const addFormDefinition = useWorkflowStore((state) => state.addFormDefinition);
    const dataEntities = useWorkflowStore((state) => state.dataEntities);
    const nodes = useWorkflowStore((state) => state.nodes);
    const edges = useWorkflowStore((state) => state.edges);
    const existingForms = useWorkflowStore((state) => state.formDefinitions);

    // AI Form Auto-Discovery Mutation
    const { mutate: autoDiscoverForm, isPending: isLoading } = useMutation({
        mutationFn: async () => {
            const processContext = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.data.label
                })),
                edges: edges.map(e => ({ source: e.source, target: e.target }))
            };

            const simplifiedEntities = dataEntities.map(e => ({
                alias: e.alias,
                type: e.type,
                description: e.description
            }));

            const simplifiedForms = existingForms.map(f => ({
                name: f.formName,
                description: f.formDescription
            }));

            return await suggestFormAutoDiscovery(processContext, simplifiedEntities, simplifiedForms);
        },
        onSuccess: (data) => {
            if (data && data.formDefinitions && data.formDefinitions.length > 0) {
                setGeneratedForm(data.formDefinitions[0]);
            } else {
                alert("No new form suggestions found.");
            }
        },
        onError: (error) => {
            console.error("Form discovery failed:", error);
            alert("Failed to analyze forms. Please try again.");
        }
    });

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
        <BaseModal
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">
                        {generatedForm ? 'Smart Data Linking' : 'Form Architect'}
                    </h3>
                </div>
            }
            icon={LayoutTemplate}
            maxWidth="max-w-2xl"
            hideCloseButton={false}
        >
            {/* Body Content */}
            {!generatedForm ? (
                <>
                    <div className="flex border-b border-slate-100 flex-shrink-0">
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

                    <div className="p-6 bg-slate-50/50 min-h-[300px] flex flex-col">
                        {activeTab === 'AI' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                <div className="p-4 bg-white rounded-full shadow-sm border border-indigo-100 mb-2">
                                    <BrainCircuit size={32} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-700">Auto-Analyze Context</h4>
                                    <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                                        AI scans your process map and existing data entities to suggest the most appropriate form structure automatically.
                                    </p>
                                </div>

                                <AiActionButton
                                    onClick={() => autoDiscoverForm()}
                                    isLoading={isLoading}
                                    loadingText="Analyzing Workflow..."
                                    className="shadow-lg shadow-indigo-200"
                                    icon={Wand2}
                                    fullWidth={true}
                                >
                                    Suggest Missing Form
                                </AiActionButton>
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
                <div className="flex flex-col h-[500px]">
                    <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-start gap-3 flex-shrink-0">
                        <Sparkles size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-blue-800 font-medium">AI suggestion ready: <span className="font-bold">{generatedForm.formName}</span></p>
                            <p className="text-[10px] text-blue-600 mt-0.5">Please review the fields and their data mappings below.</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 custom-scrollbar">
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

                    <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 flex-shrink-0">
                        <button onClick={() => setGeneratedForm(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Back</button>
                        <button onClick={handleConfirmSave} className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-indigo-700">
                            Confirm & Save Form
                        </button>
                    </div>
                </div>
            )}
        </BaseModal>
    );
}

// ... (SmartFieldLinker implementation remains same as before or updated if needed)
// Internal Component: Field Binding Row (Logic from SmartFieldLinker)
// [Helper] Map Form Component to Data Entity Type
const mapComponentToDataType = (component: FormFieldComponent): DataEntityType => {
    switch (component) {
        case 'input_number': return 'number';
        case 'checkbox':
        case 'tri_state_checkbox': return 'boolean';
        case 'date_picker':
        case 'date_time_picker': return 'date';
        case 'file_upload':
        case 'file_list': return 'file';
        case 'dropdown': return 'lookup';
        case 'multiple_dropdown': return 'lookup_array';
        default: return 'string';
    }
}

function SmartFieldLinker({ field, dataEntities }: { field: FormField, dataEntities: DataEntity[] }) {
    // 1. Exact Match Check
    const exactMatch = dataEntities.find(e => e.alias === field.entityAlias);

    // 2. Fuzzy Match Logic
    const suggestedMatch = !exactMatch
        ? dataEntities.find(e =>
            e.alias.toLowerCase().includes(field.entityAlias.toLowerCase()) ||
            field.entityAlias.toLowerCase().includes(e.alias.toLowerCase())
        )
        : undefined;

    const [status, setStatus] = useState<'LINKED' | 'SUGGESTED' | 'NEW'>(
        exactMatch ? 'LINKED' : suggestedMatch ? 'SUGGESTED' : 'NEW'
    );
    const [linkedEntity, setLinkedEntity] = useState<DataEntity | undefined>(exactMatch || suggestedMatch);

    // [New] Interaction Mode State
    const [mode, setMode] = useState<'VIEW' | 'SELECT' | 'CREATE'>('VIEW');

    // [New] Create Form State
    const [newEntityAlias, setNewEntityAlias] = useState(field.entityAlias);
    const [newEntityType, setNewEntityType] = useState<DataEntityType>(mapComponentToDataType(field.component));

    const addDataEntity = useWorkflowStore((state) => state.addDataEntity);

    // --- Handlers ---

    // A. 기존 엔티티 선택 핸들러
    const handleSelectExisting = (entity: DataEntity) => {
        setLinkedEntity(entity);
        setStatus('LINKED');
        setMode('VIEW');
    };

    // B. 새 엔티티 생성 핸들러 (확정)
    const handleConfirmCreate = () => {
        if (!newEntityAlias) return;

        const newEntity: DataEntity = {
            id: `entity_${newEntityAlias.toLowerCase()}_${Date.now()}`,
            alias: newEntityAlias,
            label: field.label,
            type: newEntityType,
            description: `Auto-created from form field '${field.label}'`,
            sourceNodeId: 'manual_creation',
            required: field.required,
            isPrimaryKey: false,
            // Lookup 등 추가 데이터는 기본값 처리 (필요시 UI 확장 가능)
            lookupData: newEntityType.includes('lookup') ? { name: 'New Lookup', lookupItems: [] } : undefined
        };

        addDataEntity(newEntity);
        setLinkedEntity(newEntity);
        setStatus('LINKED');
        setMode('VIEW');
    };

    const handleAcceptSuggestion = () => {
        if (linkedEntity) {
            setStatus('LINKED');
        }
    };

    return (
        <div className={clsx(
            "rounded-lg border text-sm transition-all bg-white overflow-hidden",
            status === 'LINKED' ? "border-green-200 shadow-sm" :
                status === 'SUGGESTED' ? "border-amber-200 ring-1 ring-amber-50" : "border-slate-200"
        )}>
            {/* Main Row */}
            <div className="flex items-center justify-between p-3">
                {/* Field Info (Left) */}
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
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 truncate">
                            {field.entityAlias}
                            <span className="bg-slate-100 px-1 rounded text-[9px]">{field.component}</span>
                        </p>
                    </div>
                </div>

                {/* Action Area (Right) */}
                <div className="flex items-center gap-2 pl-2">
                    {/* CASE 1: Linked State (Show Badge) */}
                    {status === 'LINKED' && linkedEntity && mode === 'VIEW' && (
                        <div
                            className="flex items-center gap-1.5 text-[10px] text-green-600 bg-green-50 px-2 py-1.5 rounded border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                            onClick={() => setMode('SELECT')} // 클릭 시 다시 선택 모드로
                            title="Click to change"
                        >
                            <LinkIcon size={10} />
                            <span className="font-mono max-w-[100px] truncate">{linkedEntity.alias}</span>
                        </div>
                    )}

                    {/* CASE 2: Suggestion State (Show Accept Button) */}
                    {status === 'SUGGESTED' && linkedEntity && mode === 'VIEW' && (
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-amber-600 font-bold">Suggestion</span>
                                <span className="text-[9px] text-slate-500 font-mono bg-slate-50 px-1 rounded border border-slate-100 max-w-[80px] truncate">
                                    {linkedEntity.alias}
                                </span>
                            </div>
                            <button
                                onClick={handleAcceptSuggestion}
                                className="p-1.5 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
                                title="Accept Suggestion"
                            >
                                <CheckCircle2 size={14} />
                            </button>
                            <div className="h-4 w-px bg-slate-200 mx-1"></div>
                            <button onClick={() => setMode('SELECT')} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    )}

                    {/* CASE 3: New/Unlinked or Edit Mode Buttons */}
                    {(status === 'NEW' || mode !== 'VIEW') && mode !== 'CREATE' && (
                        <div className="flex items-center gap-2">
                            {/* Select Button */}
                            <button
                                onClick={() => setMode(mode === 'SELECT' ? 'VIEW' : 'SELECT')}
                                className={clsx(
                                    "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded border transition-all",
                                    mode === 'SELECT'
                                        ? "bg-slate-100 text-slate-800 border-slate-300"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent hover:border-slate-200"
                                )}
                            >
                                <Database size={10} />
                                <span>Select</span>
                            </button>

                            <div className="h-4 w-px bg-slate-200"></div>

                            {/* Create New Button */}
                            <button
                                onClick={() => setMode('CREATE')}
                                className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-1.5 rounded border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all shadow-sm"
                            >
                                <Plus size={10} />
                                <span>Create New</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Panel: Selection Mode */}
            {mode === 'SELECT' && (
                <div className="border-t border-slate-100 bg-slate-50 p-2 animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {dataEntities.length > 0 ? (
                            dataEntities.map(entity => (
                                <button
                                    key={entity.id}
                                    onClick={() => handleSelectExisting(entity)}
                                    className="w-full flex items-center justify-between text-xs p-2 rounded hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent transition-all group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-500"></div>
                                        <span className="font-mono text-slate-600 group-hover:text-indigo-700">{entity.alias}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 border border-slate-200 px-1 rounded bg-slate-100">{entity.type}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-2">No existing entities found.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Sub-Panel: Creation Mode */}
            {mode === 'CREATE' && (
                <div className="border-t border-slate-100 bg-blue-50/50 p-3 animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Entity Alias</label>
                            <input
                                type="text"
                                value={newEntityAlias}
                                onChange={(e) => setNewEntityAlias(e.target.value)}
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. UserEmail"
                            />
                        </div>
                        <div className="w-1/3 space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Type</label>
                            <select
                                value={newEntityType}
                                onChange={(e) => setNewEntityType(e.target.value as DataEntityType)}
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none bg-white"
                            >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="date">Date</option>
                                <option value="file">File</option>
                                <option value="lookup">Lookup</option>
                            </select>
                        </div>
                        <button
                            onClick={handleConfirmCreate}
                            disabled={!newEntityAlias}
                            className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors h-[30px] flex items-center justify-center w-[30px]"
                            title="Save Entity"
                        >
                            <Save size={14} />
                        </button>
                        <button
                            onClick={() => setMode('VIEW')}
                            className="bg-white border border-slate-300 text-slate-500 p-1.5 rounded hover:bg-slate-50 transition-colors h-[30px] flex items-center justify-center w-[30px]"
                            title="Cancel"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}