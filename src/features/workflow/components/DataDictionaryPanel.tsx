import { useState } from 'react'; // [Change] Import useState
import {
    Database,
    Search,
    Box,
    ListFilter,
    Plus // [Change] Import Plus
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { DataEntity, DataEntitiesGroup } from '../../../types/workflow';
import { CreateEntityModal } from './forms/CreateEntityModal'; // [New] Import

/**
 * 전역 데이터 엔티티 리스트를 보여주는 패널
 */
export function DataDictionaryPanel() {
    const dataEntities = useWorkflowStore((state) => state.dataEntities);
    const groups = useWorkflowStore((state) => state.dataGroups);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false); // [New] State

    // [Fix] Handle empty state inside the main layout to keep header visible
    const isEmpty = !dataEntities || dataEntities.length === 0;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded">
                            <Database size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Data Dictionary</h2>
                    </div>

                    {/* [New] Add Entity Button */}
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-100 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus size={14} />
                        New Entity
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search variables..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <Database size={24} className="text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-600">No Data Entities Yet</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Use the <b>"+ New Entity"</b> button above <br/>
                                or wait for AI generation.
                            </p>
                        </div>
                    </div>
                ) : (
                    groups.map((group) => (
                        <EntityGroup key={group.id} group={group} allEntities={dataEntities} />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between">
                <span>Total Entities: {dataEntities.length}</span>
                <span>Groups: {groups.length}</span>
            </div>

            {/* [New] Modal */}
            {isCreateModalOpen && (
                <CreateEntityModal onClose={() => setCreateModalOpen(false)} />
            )}
        </div>
    );
}

function EntityGroup({ group, allEntities }: { group: DataEntitiesGroup, allEntities: DataEntity[] }) {
    const groupEntities = allEntities.filter(e => group.entityIds.includes(e.id));

    if (groupEntities.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
                <Box size={14} className="text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{group.name}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {groupEntities.map((entity, idx) => (
                    <div
                        key={entity.id}
                        className={clsx(
                            "p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors group",
                            idx !== groupEntities.length - 1 && "border-b border-slate-100"
                        )}
                    >
                        <div className="mt-0.5">
                            <TypeIcon type={entity.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-xs font-bold text-slate-700 font-mono group-hover:text-indigo-600 transition-colors">
                                    {entity.alias}
                                </span>
                                <span className="text-[9px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50">
                                    {entity.type}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{entity.label}</p>

                            {/* Lineage Info */}
                            {entity.sourceNodeId && (
                                <div className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-400">
                                    <ListFilter size={10} />
                                    <span>From: {entity.sourceNodeId === 'manual_bulk_creation' ? 'Manual Entry' : entity.sourceNodeId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TypeIcon({ type }: { type: string }) {
    if (type.includes('date')) return <div className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Date" />;
    if (type.includes('number') || type.includes('integer')) return <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Number" />;
    if (type.includes('boolean')) return <div className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Boolean" />;
    if (type.includes('file')) return <div className="w-1.5 h-1.5 rounded-full bg-slate-500" title="File" />;
    return <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="String" />;
}