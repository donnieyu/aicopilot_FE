import { useState } from 'react';
import { Lightbulb, ArrowRight, Check, X } from 'lucide-react';
import type { NodeSuggestion } from '../../../types/workflow';
import clsx from 'clsx';
import { StatusBadge } from '../../../components/StatusBadge'; // [New] Import

interface SuggestionPanelProps {
    suggestions: NodeSuggestion[];
    onApply: (suggestion: NodeSuggestion) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export function SuggestionPanel({ suggestions, onApply, onClose, isLoading }: SuggestionPanelProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    if (isLoading) {
        return (
            <div className="absolute bottom-6 right-6 w-80 bg-white rounded-xl shadow-xl border border-blue-100 p-4 animate-pulse z-50">
                <div className="flex items-center gap-2 text-blue-600 mb-3">
                    <Lightbulb className="w-5 h-5 animate-bounce" />
                    <span className="font-semibold text-sm">AI가 분석 중입니다...</span>
                </div>
                <div className="space-y-2">
                    <div className="h-16 bg-slate-100 rounded-lg"></div>
                    <div className="h-16 bg-slate-100 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="absolute bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex justify-between items-start border-b border-blue-100">
                <div className="flex gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm text-amber-500">
                        <Lightbulb size={18} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">AI Co-Architect 제안</h3>
                        <p className="text-xs text-slate-500 mt-0.5">현재 흐름에 가장 적합한 다음 단계입니다.</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full p-1 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2 bg-slate-50">
                {suggestions.map((item, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "group bg-white rounded-lg border transition-all cursor-pointer hover:shadow-md relative overflow-hidden",
                            selectedIndex === idx
                                ? "border-blue-500 ring-1 ring-blue-500"
                                : "border-slate-200 hover:border-blue-300"
                        )}
                        onClick={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
                    >
                        {/* Card Body */}
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                {/* [Refactor] StatusBadge 사용 */}
                                <StatusBadge type={item.type} />
                                <span className="text-[10px] text-slate-400 font-mono">Confidence: High</span>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.reason}</p>
                        </div>

                        {/* Expandable Details (Smart Binding Preview) */}
                        {selectedIndex === idx && (
                            <div className="bg-slate-50 border-t border-slate-100 p-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                {item.inputMapping && Object.keys(item.inputMapping).length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                            Smart Data Binding
                                        </p>
                                        <div className="space-y-1">
                                            {Object.entries(item.inputMapping).map(([key, value]) => (
                                                <div key={key} className="flex items-center text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                                                    <span className="font-medium text-slate-600 min-w-[60px]">{key}</span>
                                                    <ArrowRight size={12} className="mx-2 text-slate-300" />
                                                    <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded flex-1 truncate" title={value}>
                                                        {value}
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApply(item);
                                    }}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Check size={16} />
                                    제안 적용하기
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}