import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    LayoutTemplate,
    Search,
    Eye,
    FileText,
    X,
    Plus,
    Link as LinkIcon,
    Database,
    AlertTriangle,
    CheckCircle2,
    ArrowLeftRight,
    Settings2,
    Columns
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { FormDefinitions, FormField, DataEntity, DataEntityType, FormFieldComponent } from '../../../types/workflow';
import { FormRenderer } from './forms/FormRenderer';
import { CreateFormModal } from './forms/CreateFormModal';

/**
 * 전역 폼 정의 리스트 패널
 * 생성된 모든 폼을 조회하고, 새로운 폼을 생성할 수 있습니다.
 */
export function FormListPanel() {
    const formDefinitions = useWorkflowStore((state) => state.formDefinitions);
    const [previewForm, setPreviewForm] = useState<FormDefinitions | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const isEmpty = !formDefinitions || formDefinitions.length === 0;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-pink-100 text-pink-600 rounded">
                            <LayoutTemplate size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Form Dictionary</h2>
                    </div>

                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg shadow-md shadow-pink-100 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus size={14} />
                        New Form
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search forms..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <LayoutTemplate size={24} className="text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-600">No Forms Generated Yet</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Use the <b>"+ New Form"</b> button above <br/>
                                or wait for AI generation.
                            </p>
                        </div>
                    </div>
                ) : (
                    formDefinitions.map((form, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-sm transition-all group cursor-pointer relative overflow-hidden"
                            onClick={() => setPreviewForm(form)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors truncate max-w-[180px]">
                                        {form.formName}
                                    </h3>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                {form.formDescription || "No description available."}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    {form.fieldGroups.length} Groups
                                </span>
                                <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    {form.fieldGroups.reduce((acc, g) => acc + g.fields.length, 0)} Fields
                                </span>
                            </div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100">
                                    <Columns size={16} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between">
                <span>Total Forms: {formDefinitions ? formDefinitions.length : 0}</span>
            </div>

            {/* Global Form Inspector Modal (Side-by-Side) */}
            {previewForm && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewForm(null)}>
                    <div
                        className="bg-white w-full max-w-[1300px] h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                                    <Settings2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Form Inspector</h3>
                                    <p className="text-xs text-slate-500">
                                        <span className="font-semibold text-pink-600 mr-2">{previewForm.formName}</span>
                                        Manage data bindings and UI preview
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content - Side by Side Layout */}
                        <div className="flex-1 overflow-hidden flex flex-row">

                            {/* LEFT: UI Preview */}
                            <div className="flex-1 bg-slate-100/50 overflow-y-auto custom-scrollbar p-8 relative border-r border-slate-200">
                                <div className="max-w-2xl mx-auto">
                                    <div className="flex items-center justify-between mb-4 sticky top-0 z-10 backdrop-blur-sm py-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Eye size={14} /> UI Preview
                                        </h4>
                                        <span className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                            Read-Only Mode
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 p-8 min-h-[600px]">
                                        <FormRenderer definition={previewForm} readOnly={true} />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Data Binding Panel */}
                            <div className="w-[450px] bg-white flex flex-col h-full shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] z-10 flex-shrink-0">
                                <div className="px-5 py-4 border-b border-slate-100 bg-white">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <LinkIcon size={14} /> Data Entity Mapping
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Connect each visual field to a data entity.
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-50/30">
                                    <div className="space-y-4 p-4 pb-32"> {/* Added padding bottom for overlays */}
                                        {previewForm.fieldGroups.map(group => (
                                            // [Fix] Removed 'overflow-hidden' to allow popovers to show
                                            <div key={group.id} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                                                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center rounded-t-xl">
                                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                                        {group.name}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                        {group.fields.length} Fields
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-slate-50 rounded-b-xl">
                                                    {group.fields.map(field => (
                                                        <FieldBindingRow key={field.id} field={field} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center flex-shrink-0">
                            <p className="text-[10px] text-slate-400">
                                * Changes to data bindings are applied to the schema immediately.
                            </p>
                            <button onClick={() => setPreviewForm(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isCreateModalOpen && createPortal(
                <CreateFormModal onClose={() => setCreateModalOpen(false)} />,
                document.body
            )}
        </div>
    );
}

// ------------------------------------------------------------------
// Internal Component: Field Binding Row (Logic from SmartFieldLinker)
// ------------------------------------------------------------------

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

function FieldBindingRow({ field }: { field: FormField }) {
    const dataEntities = useWorkflowStore((state) => state.dataEntities);
    const addDataEntity = useWorkflowStore((state) => state.addDataEntity);

    // Logic to find binding
    const exactMatch = dataEntities.find(e => e.alias === field.entityAlias);
    const linkedEntity = exactMatch;
    const isBound = !!linkedEntity;

    // Interaction State
    const [isEditing, setIsEditing] = useState(false);
    const [mode, setMode] = useState<'SELECT' | 'CREATE'>('SELECT');

    // Create New State
    const [newEntityAlias, setNewEntityAlias] = useState(field.entityAlias);
    const [newEntityType, setNewEntityType] = useState<DataEntityType>(mapComponentToDataType(field.component));

    const handleSelectExisting = (entity: DataEntity) => {
        // 실제로는 FormField의 entityAlias를 업데이트해야 하지만,
        // 현재 Store에는 updateFormField 액션이 없으므로 개념적으로만 구현하거나
        // 여기서는 'Create New'를 통해 새로운 매핑을 만드는 flow를 강조합니다.
        // (실제 구현 시: updateFormField(field.id, { entityAlias: entity.alias }))
        alert(`Linked to existing: ${entity.alias} (Store update needed)`);
        setIsEditing(false);
    };

    const handleCreateNew = () => {
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
            lookupData: newEntityType.includes('lookup') ? { name: 'New Lookup', lookupItems: [] } : undefined
        };
        addDataEntity(newEntity);
        // 여기서도 폼 필드의 alias를 업데이트해야 완벽함.
        // 현재는 Store에 Entity가 추가됨으로써 "연결 가능 상태"가 됨을 시각적으로 표현.
        setIsEditing(false);
    };

    return (
        // [Fix] Add 'relative' and conditional z-index to allow overlay to appear on top
        <div className={clsx("p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors relative", isEditing ? "z-20" : "z-0")}>
            {/* Left: Field Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold shadow-sm flex-shrink-0",
                    isBound ? "bg-green-50 border-green-200 text-green-600" : "bg-amber-50 border-amber-200 text-amber-600"
                )}>
                    {isBound ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{field.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                            {field.component}
                        </span>
                        {field.required && <span className="text-[10px] text-red-500 font-bold">*Req</span>}
                    </div>
                </div>
            </div>

            {/* Right: Binding Control */}
            <div className="flex items-center gap-4 pl-2">
                {/* Arrow Connector */}
                <ArrowLeftRight size={14} className="text-slate-300 flex-shrink-0" />

                {/* Binding Target */}
                <div className="relative min-w-[160px] flex justify-end">
                    {!isEditing ? (
                        isBound ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50/50 hover:bg-green-100 transition-all text-left w-full group/btn"
                            >
                                <div className="p-1 bg-green-100 text-green-600 rounded group-hover/btn:bg-white flex-shrink-0">
                                    <Database size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-green-700 truncate">{linkedEntity.alias}</p>
                                    <p className="text-[9px] text-green-600 opacity-80 truncate">{linkedEntity.type}</p>
                                </div>
                                <Settings2 size={12} className="text-green-400 opacity-0 group-hover/btn:opacity-100" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all w-full shadow-sm hover:shadow"
                            >
                                <LinkIcon size={14} />
                                Link Data
                            </button>
                        )
                    ) : (
                        // --- EDIT MODE PANEL ---
                        <div className="absolute right-0 top-[-10px] w-[260px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-in zoom-in-95 duration-200">
                            {/* [Fix] Added Close Button on Header */}
                            <div className="flex border-b border-slate-100 relative">
                                <button
                                    onClick={() => setMode('SELECT')}
                                    className={clsx("flex-1 py-2 text-[10px] font-bold border-r border-slate-100", mode === 'SELECT' ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50")}
                                >
                                    Select
                                </button>
                                <button
                                    onClick={() => setMode('CREATE')}
                                    className={clsx("flex-1 py-2 text-[10px] font-bold border-r border-slate-100", mode === 'CREATE' ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50")}
                                >
                                    Create New
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    title="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="p-3 bg-slate-50/50">
                                {mode === 'SELECT' ? (
                                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                        {dataEntities.length > 0 ? (
                                            dataEntities.map(e => (
                                                <button
                                                    key={e.id}
                                                    onClick={() => handleSelectExisting(e)}
                                                    className="w-full text-left flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-xs"
                                                >
                                                    <span className="font-bold text-slate-700 truncate">{e.alias}</span>
                                                    <span className="text-[9px] bg-slate-100 px-1 rounded flex-shrink-0">{e.type}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-slate-400 text-center py-2">No entities found.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Alias</label>
                                            <input
                                                type="text"
                                                value={newEntityAlias}
                                                onChange={(e) => setNewEntityAlias(e.target.value)}
                                                className="w-full text-xs border p-1.5 rounded focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Type</label>
                                            <select
                                                value={newEntityType}
                                                onChange={(e) => setNewEntityType(e.target.value as DataEntityType)}
                                                className="w-full text-xs border p-1.5 rounded bg-white focus:border-blue-500 outline-none"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="date">Date</option>
                                                <option value="file">File</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleCreateNew}
                                            className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg mt-2 hover:bg-blue-700 shadow-sm"
                                        >
                                            Create & Link
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 p-2 bg-slate-50 flex justify-center">
                                <button onClick={() => setIsEditing(false)} className="text-[10px] text-slate-400 hover:text-slate-600">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}