import {
    Calendar,
    Type,
    Hash,
    // [Fix] Unused import 'CheckSquare' removed
    List,
    UploadCloud,
    AlignLeft,
    ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import type { FormDefinitions, FormField } from '../../../../types/workflow';

interface FormRendererProps {
    definition: FormDefinitions;
    readOnly?: boolean;
}

/**
 * JSON 폼 정의를 실제 UI로 변환하는 렌더러
 * "What You See Is What You Get" 경험을 제공합니다.
 */
export function FormRenderer({ definition, readOnly = false }: FormRendererProps) {
    return (
        <div className="space-y-6">
            {/* Form Header */}
            <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">{definition.formName}</h3>
                {definition.formDescription && (
                    <p className="text-sm text-slate-500 mt-1">{definition.formDescription}</p>
                )}
            </div>

            {/* Field Groups */}
            <div className="space-y-6">
                {definition.fieldGroups.map((group) => (
                    <div key={group.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            {group.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {group.fields.map((field) => (
                                <FieldComponent key={field.id} field={field} readOnly={readOnly} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Button Mockup */}
            <div className="pt-4 flex justify-end">
                <button disabled className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold opacity-50 cursor-not-allowed">
                    Submit Form
                </button>
            </div>
        </div>
    );
}

function FieldComponent({ field, readOnly }: { field: FormField, readOnly: boolean }) {
    const { label, component, required } = field;

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative group">
                {renderInput(field, readOnly)}

                {/* Field Type Indicator (Hover) */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 border border-slate-200 pointer-events-none">
                    {component}
                </div>
            </div>
        </div>
    );
}

function renderInput(field: FormField, readOnly: boolean) {
    const baseClass = "w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all disabled:bg-slate-100 disabled:text-slate-500";

    switch (field.component) {
        case 'input_textarea':
            return (
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea
                        className={clsx(baseClass, "pl-9 min-h-[80px] resize-none")}
                        placeholder="Enter text..."
                        disabled={readOnly}
                    />
                </div>
            );

        case 'input_number':
            return (
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" className={clsx(baseClass, "pl-9")} placeholder="0.00" disabled={readOnly} />
                </div>
            );

        case 'date_picker':
        case 'date_time_picker':
            return (
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="date" className={clsx(baseClass, "pl-9")} disabled={readOnly} />
                </div>
            );

        case 'dropdown':
        case 'multiple_dropdown':
            return (
                <div className="relative">
                    <List className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select className={clsx(baseClass, "pl-9 appearance-none")} disabled={readOnly}>
                        <option>Select an option...</option>
                        <option>Option A</option>
                        <option>Option B</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            );

        case 'checkbox':
        case 'tri_state_checkbox':
            return (
                <div className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-white">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" disabled={readOnly} />
                    <span className="text-sm text-slate-600">Yes, I agree / confirm</span>
                </div>
            );

        case 'file_upload':
        case 'file_list':
            return (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group/file">
                    <div className="p-3 bg-slate-100 rounded-full mb-2 group-hover/file:bg-blue-50 group-hover/file:text-blue-500 transition-colors">
                        <UploadCloud size={20} className="text-slate-400 group-hover/file:text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Click to upload</span>
                    <span className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG (Max 10MB)</span>
                </div>
            );

        case 'input_text':
        default:
            return (
                <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" className={clsx(baseClass, "pl-9")} placeholder="Value..." disabled={readOnly} />
                </div>
            );
    }
}