import { useState, useMemo, type ElementType } from 'react';
import { LayoutTemplate, ChevronDown, ChevronUp, FileText, CheckCircle2, Zap, User, Settings, GitFork } from 'lucide-react';
import clsx from 'clsx';

// Mock Templates moved here or imported from a shared constant file
const MOCK_TEMPLATES: Record<string, { label: string, desc: string, icon: ElementType }[]> = {
    'Expense Reimbursement': [
        { label: 'Standard Approval', desc: 'Employee submits -> Manager approves -> Finance processes payment.', icon: FileText },
        { label: 'High Value (> $5k)', desc: 'Strict validation: Manager -> VP -> Compliance -> Finance.', icon: CheckCircle2 },
        { label: 'Travel Expenses', desc: 'Pre-trip approval -> Booking -> Post-trip reporting -> Reimbursement.', icon: Zap }
    ],
    'Employee Onboarding': [
        { label: 'Simple Access Grant', desc: 'Create Account -> Assign Hardware -> Grant System Access.', icon: Settings },
        { label: 'Full Onboarding', desc: 'HR Intro -> IT Setup -> Team Welcome -> Mandatory Training -> 30-Day Review.', icon: User }
    ],
    'IT Support Ticket': [
        { label: 'Password Reset', desc: 'Verify Identity -> Reset Password -> Notify User.', icon: Settings },
        { label: 'Hardware Replacement', desc: 'Diagnose -> Approve Replacement -> Procurement -> Setup -> Delivery.', icon: Settings }
    ]
};

const DEFAULT_TEMPLATES = [
    { label: 'Simple Review', desc: 'Submit -> Review -> Approve/Reject', icon: FileText },
    { label: 'Multi-stage Approval', desc: 'Submit -> Team Lead -> Dept Head -> Final Approval', icon: GitFork },
    { label: 'Complex Flow', desc: 'Parallel processing with multiple departments.', icon: Zap }
];

interface TemplateSelectorProps {
    topic: string;
    onSelect: (desc: string) => void;
    selectedDesc?: string;
}

export function TemplateSelector({ topic, onSelect, selectedDesc }: TemplateSelectorProps) {
    // [Change] Default state to true (expanded)
    const [isExpanded, setExpanded] = useState(true);

    const currentTemplates = useMemo(() => {
        const key = Object.keys(MOCK_TEMPLATES).find(k => topic.includes(k));
        return key ? MOCK_TEMPLATES[key] : DEFAULT_TEMPLATES;
    }, [topic]);

    const handleSelect = (desc: string) => {
        onSelect(desc);
        // setExpanded(false); // Optional: close on select
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <LayoutTemplate size={14} />
                    Templates
                </span>
                <button
                    onClick={() => setExpanded(!isExpanded)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {isExpanded && (
                <div className="p-3 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    {currentTemplates.map((tpl, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(tpl.desc)}
                            className={clsx(
                                "w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden",
                                selectedDesc === tpl.desc
                                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                                    : "border-slate-100 hover:border-blue-400 hover:bg-blue-50/50"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <tpl.icon size={16} className={clsx(
                                    selectedDesc === tpl.desc ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                                )} />
                                <span className={clsx(
                                    "text-xs font-bold truncate",
                                    selectedDesc === tpl.desc ? "text-blue-700" : "text-slate-700 group-hover:text-blue-700"
                                )}>{tpl.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed pl-6">
                                {tpl.desc}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}