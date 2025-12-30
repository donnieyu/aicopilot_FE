import { useState } from 'react';
import {
    Database,
    Box,
    ListFilter,
    Plus
} from 'lucide-react';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { DataEntity, DataEntitiesGroup } from '../../../types/workflow';
import { CreateEntityModal } from './forms/CreateEntityModal';
import { SearchInput } from '../../../components/SearchInput';

/**
 * 전역 데이터 엔티티 리스트를 보여주는 패널
 * [Refactor] 메인 탭으로 승격됨에 따라 레이아웃 너비 제한 추가 (가독성 확보)
 */
export function DataDictionaryPanel() {
    const dataEntities = useWorkflowStore((state) => state.dataEntities);
    const groups = useWorkflowStore((state) => state.dataGroups);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isEmpty = !dataEntities || dataEntities.length === 0;

    return (
        <div className="h-full w-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Center Container for Wide Screens */}
            <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto bg-white shadow-sm border-x border-slate-200 h-full">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Database size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Data Dictionary</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Manage all business variables and data types across the process.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            <Plus size={16} />
                            New Entity
                        </button>
                    </div>

                    <div className="max-w-md">
                        <SearchInput
                            placeholder="Search variables by name, alias, or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="py-2.5 text-sm"
                        />
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-6 opacity-60">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                                <Database size={32} className="text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-600">No Data Entities Yet</h3>
                                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                    Use the <b>"+ New Entity"</b> button above <br/>
                                    or wait for the AI Data Modeler to finish analysis.
                                </p>
                            </div>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <EntityGroup
                                key={group.id}
                                group={group}
                                allEntities={dataEntities}
                                filter={searchTerm}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-white text-xs text-slate-400 flex justify-between">
                    <span className="font-medium">Total Entities: {dataEntities.length}</span>
                    <span className="font-medium">Groups: {groups.length}</span>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateEntityModal onClose={() => setCreateModalOpen(false)} />
            )}
        </div>
    );
}

function EntityGroup({ group, allEntities, filter }: { group: DataEntitiesGroup, allEntities: DataEntity[], filter: string }) {
    const groupEntities = allEntities.filter(e =>
        group.entityIds.includes(e.id) &&
        (
            !filter ||
            e.alias.toLowerCase().includes(filter.toLowerCase()) ||
            e.label.toLowerCase().includes(filter.toLowerCase())
        )
    );

    if (groupEntities.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 border-l-4 border-indigo-500 pl-3">
                <Box size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{group.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                    {groupEntities.length}
                </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 divide-y divide-slate-100">
                {groupEntities.map((entity) => (
                    <div
                        key={entity.id}
                        className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            <TypeIcon type={entity.type} />
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                            {/* 1. Name & Alias (Col 4) */}
                            <div className="col-span-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700 font-mono group-hover:text-indigo-600 transition-colors truncate">
                                        {entity.alias}
                                    </span>
                                    {entity.required && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 rounded">Req</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{entity.label}</p>
                            </div>

                            {/* 2. Type Badge (Col 2) */}
                            <div className="col-span-2">
                                <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-1 rounded bg-slate-50 uppercase tracking-wide">
                                    {entity.type}
                                </span>
                            </div>

                            {/* 3. Description (Col 4) */}
                            <div className="col-span-4">
                                <p className="text-xs text-slate-400 truncate">{entity.description || '-'}</p>
                            </div>

                            {/* 4. Lineage (Col 2) */}
                            <div className="col-span-2 flex justify-end">
                                {entity.sourceNodeId && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                        <ListFilter size={10} />
                                        <span className="truncate max-w-[100px]" title={entity.sourceNodeId}>
                                            {entity.sourceNodeId === 'manual_bulk_creation' ? 'Manual' : entity.sourceNodeId}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TypeIcon({ type }: { type: string }) {
    if (type.includes('date')) return <div className="w-2 h-2 rounded-full bg-orange-400 ring-2 ring-orange-100" title="Date" />;
    if (type.includes('number') || type.includes('integer')) return <div className="w-2 h-2 rounded-full bg-blue-400 ring-2 ring-blue-100" title="Number" />;
    if (type.includes('boolean')) return <div className="w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-100" title="Boolean" />;
    if (type.includes('file')) return <div className="w-2 h-2 rounded-full bg-slate-500 ring-2 ring-slate-200" title="File" />;
    return <div className="w-2 h-2 rounded-full bg-green-400 ring-2 ring-green-100" title="String" />;
}