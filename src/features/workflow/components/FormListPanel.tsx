import { useState } from 'react';
import { LayoutTemplate, Search, Eye, FileText, X } from 'lucide-react';
// [Fix] Unused import 'clsx' removed
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { FormDefinitions } from '../../../types/workflow';
import { FormRenderer } from './forms/FormRenderer';

/**
 * 전역 폼 정의 리스트 패널
 * 생성된 모든 폼을 조회하고 미리보기 할 수 있습니다.
 */
export function FormListPanel() {
    const formDefinitions = useWorkflowStore((state) => state.formDefinitions);
    const [previewForm, setPreviewForm] = useState<FormDefinitions | null>(null);

    if (!formDefinitions || formDefinitions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 opacity-50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <LayoutTemplate size={24} className="text-slate-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-600">No Forms Generated Yet</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Wait for the AI to design the UI forms <br/>
                        based on your process and data.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-pink-100 text-pink-600 rounded">
                        <LayoutTemplate size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Form Dictionary</h2>
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

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {formDefinitions.map((form, idx) => (
                    <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-sm transition-all group cursor-pointer relative overflow-hidden"
                        onClick={() => setPreviewForm(form)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                                <h3 className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
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

                        {/* Hover Action */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100">
                                <Eye size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between">
                <span>Total Forms: {formDefinitions.length}</span>
            </div>

            {/* Global Form Preview Modal */}
            {previewForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewForm(null)}>
                    <div
                        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Form Preview</h3>
                                    <p className="text-xs text-slate-500">Global Registry View</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewForm(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                            <FormRenderer definition={previewForm} readOnly={true} />
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setPreviewForm(null)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}