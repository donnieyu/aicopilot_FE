import { useState } from 'react';
import {
    Database,
    Plus,
    Trash2,
    Save,
    Wand2,
    BrainCircuit
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useWorkflowStore } from '../../../../store/useWorkflowStore';
import type { DataEntity, DataEntityType } from '../../../../types/workflow';
import { AiActionButton } from '../../../../components/AiActionButton';
import { suggestAutoDiscovery } from '../../../../api/workflow';
import { BaseModal } from '../../../../components/BaseModal'; // [New] Import BaseModal

interface CreateEntityModalProps {
    onClose: () => void;
}

// 임시 드래프트용 타입 (ID 생성 전)
interface DraftEntity {
    tempId: string;
    alias: string;
    type: DataEntityType;
    description: string;
}

export function CreateEntityModal({ onClose }: CreateEntityModalProps) {
    const addDataEntity = useWorkflowStore((state) => state.addDataEntity);
    const nodes = useWorkflowStore((state) => state.nodes);
    const edges = useWorkflowStore((state) => state.edges);
    const existingEntities = useWorkflowStore((state) => state.dataEntities);

    const [drafts, setDrafts] = useState<DraftEntity[]>([
        // 초기 빈 행 하나 제공
        { tempId: '1', alias: '', type: 'string', description: '' }
    ]);

    // Mutation for Auto-Discovery
    const { mutate: autoDiscover, isPending: isGenerating } = useMutation({
        mutationFn: async () => {
            // 1. Prepare Process Context
            const processContext = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.data.label,
                    description: n.data.description
                })),
                edges: edges.map(e => ({ source: e.source, target: e.target }))
            };

            // 2. Prepare Existing Data Context (Global + Local Drafts)

            // A. Global Dictionary Entities
            const globalEntities = existingEntities.map(e => ({
                alias: e.alias,
                type: e.type,
                description: e.description
            }));

            // B. Local Draft Entities (Currently being edited in modal)
            // [Fix] Include drafts in the context to prevent duplicate suggestions
            const localDrafts = drafts
                .filter(d => d.alias && d.alias.trim() !== '') // 유효한 이름이 있는 드래프트만 포함
                .map(d => ({
                    alias: d.alias,
                    type: d.type,
                    description: d.description
                }));

            // C. Combine All Known Entities
            const allKnownEntities = [...globalEntities, ...localDrafts];

            return await suggestAutoDiscovery(processContext, allKnownEntities);
        },
        onSuccess: (data) => {
            if (data && data.entities) {
                const newDrafts: DraftEntity[] = data.entities.map((e, idx) => ({
                    tempId: `ai_${Date.now()}_${idx}`,
                    alias: e.alias,
                    type: e.type,
                    description: e.description || 'AI Suggested'
                }));

                setDrafts(prev => {
                    // Remove empty rows if any, then append new suggestions
                    const filtered = prev.filter(p => p.alias.trim() !== '');

                    // [Optional] Client-side Deduplication check (Double safety)
                    // 이미 드래프트에 있는 별칭(Alias)과 동일한 제안은 제외
                    const existingAliases = new Set(filtered.map(d => d.alias.toLowerCase()));
                    const uniqueNewDrafts = newDrafts.filter(d => !existingAliases.has(d.alias.toLowerCase()));

                    return [...filtered, ...uniqueNewDrafts];
                });
            }
        },
        onError: (error) => {
            console.error("Auto-discovery failed:", error);
            alert("Failed to analyze process. Please try again.");
        }
    });

    // Handlers
    const handleAddRow = () => {
        setDrafts([...drafts, { tempId: Date.now().toString(), alias: '', type: 'string', description: '' }]);
    };

    const handleRemoveRow = (id: string) => {
        setDrafts(drafts.filter(d => d.tempId !== id));
    };

    const handleUpdateRow = (id: string, field: keyof DraftEntity, value: string) => {
        setDrafts(drafts.map(d => d.tempId === id ? { ...d, [field]: value } : d));
    };

    // Trigger API call
    const handleAiGenerate = () => {
        autoDiscover();
    };

    const handleSaveAll = () => {
        const validDrafts = drafts.filter(d => d.alias.trim() !== '');

        validDrafts.forEach(draft => {
            const newEntity: DataEntity = {
                // [Fix] Replaced deprecated substr with substring
                id: `entity_${draft.alias.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                alias: draft.alias,
                label: draft.alias.replace(/([A-Z])/g, ' $1').trim(), // CamelCase -> Spaced Label
                type: draft.type,
                description: draft.description || 'Manually added',
                sourceNodeId: 'manual_bulk_creation',
                required: false,
                isPrimaryKey: false,
                lookupData: draft.type.includes('lookup') ? { name: 'New Lookup', lookupItems: [] } : undefined
            };
            addDataEntity(newEntity);
        });

        onClose();
    };

    return (
        <BaseModal
            onClose={onClose}
            title={
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Data Entity Architect</h3>
                    <p className="text-xs text-slate-500 font-normal">Bulk add variables manually or ask AI to extract them.</p>
                </div>
            }
            icon={Database}
            maxWidth="max-w-4xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <p className="text-[10px] text-slate-400">
                        * {drafts.filter(d => d.alias).length} entities will be added to the dictionary.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={drafts.filter(d => d.alias).length === 0}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={16} />
                            Save to Dictionary
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full">
                {/* AI Section */}
                <div className="p-8 bg-slate-50/80 border-b border-slate-100 flex flex-col items-center justify-center gap-3 flex-shrink-0">
                    <div className="text-center mb-2">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center justify-center gap-2">
                            <BrainCircuit size={18} className="text-indigo-500" />
                            AI Auto-Discovery
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            AI will analyze your current process flow and forms to suggest necessary data fields automatically.
                        </p>
                    </div>

                    <AiActionButton
                        onClick={handleAiGenerate}
                        isLoading={isGenerating}
                        loadingText="Analyzing Process Context..."
                        className="shadow-md"
                        icon={Wand2}
                    >
                        Auto-Analyze & Suggest Entities
                    </AiActionButton>
                </div>

                {/* Grid Editor (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white min-h-[300px]">
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Grid Header */}
                        <div className="grid grid-cols-12 gap-4 bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-3">Entity Alias (Key)</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-6">Description</div>
                            <div className="col-span-1 text-center">Action</div>
                        </div>

                        {/* Grid Rows */}
                        <div className="divide-y divide-slate-100">
                            {drafts.map((draft) => (
                                <div key={draft.tempId} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors group">
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            value={draft.alias}
                                            onChange={(e) => handleUpdateRow(draft.tempId, 'alias', e.target.value)}
                                            placeholder="e.g. UserName"
                                            className="w-full text-sm font-mono font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none transition-all placeholder:font-sans placeholder:font-normal"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <select
                                            value={draft.type}
                                            onChange={(e) => handleUpdateRow(draft.tempId, 'type', e.target.value as DataEntityType)}
                                            className="w-full text-xs bg-slate-100 border-none rounded py-1.5 px-2 text-slate-600 focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                                        >
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="date">Date</option>
                                            <option value="file">File</option>
                                            <option value="lookup">Lookup</option>
                                        </select>
                                    </div>
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            value={draft.description}
                                            onChange={(e) => handleUpdateRow(draft.tempId, 'description', e.target.value)}
                                            placeholder="Description..."
                                            className="w-full text-xs text-slate-500 bg-transparent outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRemoveRow(draft.tempId)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAddRow}
                        className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 w-fit"
                    >
                        <Plus size={16} />
                        Add New Row
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}