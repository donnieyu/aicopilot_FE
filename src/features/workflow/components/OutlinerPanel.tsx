import { useState } from 'react';
import { X, ChevronRight, ChevronDown, User, Settings, GitFork } from 'lucide-react';
import clsx from 'clsx';
import type { ProcessResponse } from '@/types/workflow';
// [Fix] 미사용 import 제거
// import { useWorkflowStore } from '@/store/useWorkflowStore';

interface OutlinerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    process: ProcessResponse | null;
}

export function OutlinerPanel({ isOpen, onClose, process }: OutlinerPanelProps) {
    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

    // [Fix] 미사용 변수 nodes 제거
    // const { nodes } = useWorkflowStore();

    if (!process) return null;

    const sortedActivities = process.activities;

    const getIcon = (type: string) => {
        if (type === 'USER_TASK') return <User size={16} />;
        if (type === 'SERVICE_TASK') return <Settings size={16} />;
        if (type === 'EXCLUSIVE_GATEWAY') return <GitFork size={16} />;
        return <User size={16} />;
    };

    return (
        <div
            className={clsx(
                "fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* 1. Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{process.processName || 'Untitled Process'}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{process.description || 'No description'}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* 2. List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {sortedActivities.map((activity, index) => {
                    const isExpanded = expandedStepId === activity.id;
                    // [Fix] 타입 안전성을 위해 기본값 및 대문자 변환 추가
                    const normalizedType = (activity.type || 'USER_TASK').toUpperCase();

                    return (
                        <div
                            key={activity.id}
                            className={clsx(
                                "bg-white border rounded-xl transition-all duration-200 overflow-hidden",
                                isExpanded ? "border-blue-500 shadow-md ring-1 ring-blue-100" : "border-gray-200 hover:border-blue-300"
                            )}
                        >
                            {/* Item Header */}
                            <div
                                className="flex items-center p-3 cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedStepId(isExpanded ? null : activity.id)}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-gray-600",
                                    normalizedType === 'EXCLUSIVE_GATEWAY' ? "bg-orange-100 text-orange-600" :
                                        normalizedType === 'SERVICE_TASK' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {getIcon(normalizedType)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400 mb-0.5">Step {index + 1}</span>
                                        {activity.swimlaneId && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {activity.swimlaneId.replace('lane_', '')}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800">{activity.label}</h3>
                                </div>

                                <div className="text-gray-400 ml-2">
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                            </div>

                            {/* Item Details (Expanded) */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="h-px bg-gray-100 mb-3" />
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                                            <p className="text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 text-xs leading-relaxed">
                                                {activity.description || '설명이 없습니다.'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                                                <input
                                                    type="text"
                                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none"
                                                    value={activity.configuration?.participantRole || ''}
                                                    readOnly
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
                                                <div className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-gray-50 text-gray-600">
                                                    {normalizedType}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-2">
                                            <button className="flex-1 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-bold transition-colors">
                                                Focus on Map
                                            </button>
                                            <button className="flex-1 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded text-xs font-medium transition-colors">
                                                Edit Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}