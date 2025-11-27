import { useState, useEffect, useMemo, type ElementType } from 'react';
import {
    User,
    Settings,
    GitFork,
    Sparkles,
    Play,
    Plus,
    Trash2,
    ArrowLeft,
    FileText,
    CheckCircle2,
    Zap,
    LayoutTemplate,
    ChevronDown,
    ChevronUp,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import type { ProcessResponse, ProcessDefinition, ProcessStep } from '../../../types/workflow';
import { suggestProcessOutline } from '../../../api/workflow';
import { useMutation } from '@tanstack/react-query';

interface OutlinerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    process: ProcessResponse | null;
    onTransform?: (definition: ProcessDefinition) => void;
    initialTopic?: string;
}

// Mock Templates
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

export function OutlinerPanel({ process, onTransform, initialTopic = '' }: OutlinerPanelProps) {
    const [topic, setTopic] = useState(initialTopic);
    const [description, setDescription] = useState('');
    const [draftSteps, setDraftSteps] = useState<ProcessStep[]>([]);

    // Template Section Visibility
    const [isTemplateExpanded, setTemplateExpanded] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<{ label: string, desc: string } | null>(null);

    const [editingStepId, setEditingStepId] = useState<string | null>(null);
    const [tempStep, setTempStep] = useState<Partial<ProcessStep>>({});

    useEffect(() => {
        if (process) {
            setTopic(process.processName);
            setDescription(process.description);
            const steps: ProcessStep[] = process.activities.map((act) => ({
                stepId: act.id,
                name: act.label,
                role: act.configuration?.participantRole || 'System',
                description: act.description || '',
                type: act.type === 'EXCLUSIVE_GATEWAY' ? 'DECISION' : 'ACTION'
            }));
            setDraftSteps(steps);
            setTemplateExpanded(false);
        }
    }, [process]);

    const { mutate: getOutline, isPending: isSuggesting } = useMutation({
        mutationFn: (params: { currentTopic: string, currentDesc: string }) =>
            suggestProcessOutline(params.currentTopic, params.currentDesc),
        onSuccess: (data) => {
            setDraftSteps(data.steps);
            setSelectedTemplate(null);
        }
    });

    const currentTemplates = useMemo(() => {
        const key = Object.keys(MOCK_TEMPLATES).find(k => topic.includes(k));
        return key ? MOCK_TEMPLATES[key] : DEFAULT_TEMPLATES;
    }, [topic]);

    const handleTemplateSelect = (tpl: { label: string, desc: string }) => {
        setDescription(tpl.desc);
        setSelectedTemplate(tpl);
    };

    const handleGenerateWithAI = () => {
        if (!topic || !description) return;

        if (draftSteps.length > 0) {
            const isConfirmed = window.confirm(
                "There are existing steps. Generating a new draft will overwrite them.\nDo you want to continue?"
            );
            if (!isConfirmed) return;
        }

        getOutline({ currentTopic: topic, currentDesc: description });
    };

    const handleAddStep = (index: number) => {
        const newStep: ProcessStep = {
            stepId: `temp_${Date.now()}`,
            name: '',
            role: 'User',
            description: '',
            type: 'ACTION'
        };
        const newSteps = [...draftSteps];
        newSteps.splice(index, 0, newStep);
        setDraftSteps(newSteps);
        setEditingStepId(newStep.stepId);
        setTempStep(newStep);
    };

    const handleDeleteStep = (id: string) => {
        setDraftSteps(draftSteps.filter(s => s.stepId !== id));
    };

    const handleSaveStep = () => {
        if (editingStepId && tempStep) {
            setDraftSteps(draftSteps.map(s => s.stepId === editingStepId ? { ...s, ...tempStep } as ProcessStep : s));
            setEditingStepId(null);
            setTempStep({});
        }
    };

    const handleCancelStep = () => {
        if (editingStepId) {
            const originalStep = draftSteps.find(s => s.stepId === editingStepId);
            if (originalStep && !originalStep.name.trim()) {
                setDraftSteps(prev => prev.filter(s => s.stepId !== editingStepId));
            }
        }
        setEditingStepId(null);
        setTempStep({});
    };

    const handleTransform = () => {
        if (onTransform) {
            onTransform({ topic, steps: draftSteps });
        }
    };

    const getIcon = (type: string) => {
        if (type === 'ACTION') return <User size={18} />;
        if (type === 'DECISION') return <GitFork size={18} />;
        return <Settings size={18} />;
    };

    const handleHideTemplates = () => {
        setTemplateExpanded(false);
        setSelectedTemplate(null);
    };

    return (
        <div className="w-full h-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">

            {/* LEFT PANEL: Configuration & Templates (30%) */}
            <div className="w-full lg:w-[30%] h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 z-20 shadow-sm relative">

                {/* Header */}
                <div className="p-6 pb-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all group w-fit mb-6 shadow-sm"
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Topics</span>
                    </button>

                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Process Topic</label>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full text-xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300 transition-colors"
                                placeholder="Enter Topic"
                            />
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                    {/* Template Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <LayoutTemplate size={14} />
                                Templates
                            </span>
                            <button
                                onClick={() => isTemplateExpanded ? handleHideTemplates() : setTemplateExpanded(true)}
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {isTemplateExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {isTemplateExpanded && (
                            <div className="p-3 space-y-2">
                                {currentTemplates.map((tpl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleTemplateSelect(tpl)}
                                        className={clsx(
                                            "w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden",
                                            selectedTemplate?.label === tpl.label
                                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                                                : "border-slate-100 hover:border-blue-400 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <tpl.icon size={16} className={clsx(
                                                selectedTemplate?.label === tpl.label ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                                            )} />
                                            <span className={clsx(
                                                "text-xs font-bold truncate",
                                                selectedTemplate?.label === tpl.label ? "text-blue-700" : "text-slate-700 group-hover:text-blue-700"
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

                    {/* Context Input Area */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                            <Sparkles size={14} />
                            AI Context & Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your process goal or select a template above..."
                            className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 h-40 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />

                        <button
                            onClick={handleGenerateWithAI}
                            disabled={!topic || !description || isSuggesting}
                            className={clsx(
                                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm mt-2",
                                (!topic || !description)
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-md hover:-translate-y-0.5"
                            )}
                        >
                            {isSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isSuggesting ? "Architecting..." : "Auto-Draft with AI"}
                        </button>

                        <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2">
                            AI will generate a structured step list based on this description.
                            <br/><span className="text-orange-400">Warning: Existing steps will be overwritten.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Timeline Editor (70%) */}
            <div className="flex-1 lg:w-[70%] flex flex-col h-full overflow-hidden bg-white relative">

                {/* Loading Overlay */}
                {isSuggesting && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl border border-blue-100 flex flex-col items-center gap-4 animate-in zoom-in-95">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-white p-3 rounded-full shadow-sm">
                                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-800">Drafting Workflow...</h3>
                                <p className="text-sm text-slate-500">Analyzing context and creating steps</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeline Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <GitFork size={20} className="text-blue-600" />
                            Process Timeline
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Review and refine your process steps</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">
                            {draftSteps.length} Steps
                        </div>
                        <button
                            onClick={handleTransform}
                            disabled={draftSteps.length === 0}
                            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:scale-[0.98] text-sm"
                        >
                            <Play size={14} fill="currentColor" />
                            <span>Generate Map</span>
                        </button>
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-24 pt-8 custom-scrollbar bg-slate-50/30">
                    <div className="relative flex flex-col items-center space-y-0 max-w-3xl mx-auto">

                        {/* Start Node */}
                        <div className="flex flex-col items-center mb-8 opacity-60">
                            <div className="w-4 h-4 bg-green-500 rounded-full ring-4 ring-green-100 shadow-sm mb-2"></div>
                            <span className="text-[10px] font-black text-green-600 tracking-widest bg-green-50 px-2 py-0.5 rounded-full">START</span>
                        </div>

                        {/* Vertical Connector Line */}
                        <div className="absolute top-12 bottom-12 left-1/2 w-0.5 bg-slate-200 -z-10 transform -translate-x-1/2 dashed-line"></div>

                        {/* Empty State */}
                        {draftSteps.length === 0 && !isSuggesting && (
                            <div className="py-20 text-center w-full">
                                <div className="inline-flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-white w-full max-w-md hover:border-blue-200 transition-colors">
                                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                                        <Settings size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-600 mb-2">Timeline is Empty</p>
                                    <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                                        Use the AI panel on the left to auto-draft,<br/>
                                        or start building manually.
                                    </p>
                                    <button
                                        onClick={() => handleAddStep(0)}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <Plus size={18} />
                                        Add First Step Manually
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Steps List */}
                        {draftSteps.map((step, index) => (
                            <div key={step.stepId || index} className="w-full flex flex-col items-center relative group">

                                {/* Insert Button (Top) */}
                                <button
                                    onClick={() => handleAddStep(index)}
                                    className="absolute -top-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:scale-110 transition-all shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    title="Insert Step Here"
                                >
                                    <Plus size={16} />
                                </button>

                                {editingStepId === step.stepId ? (
                                    // Edit Card
                                    <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-6 animate-in zoom-in-95 duration-200 z-20 my-4 ring-4 ring-blue-50/50">
                                        <div className="flex justify-between items-center mb-5">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg">Editing Step {index + 1}</span>
                                        </div>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Step Name</label>
                                                <input
                                                    type="text"
                                                    value={tempStep.name || ''}
                                                    onChange={(e) => setTempStep({...tempStep, name: e.target.value})}
                                                    placeholder="e.g. Manager Approval"
                                                    className="w-full text-lg font-bold border-b border-slate-200 py-2 focus:border-blue-500 focus:outline-none transition-colors text-slate-800"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Role</label>
                                                    <input
                                                        type="text"
                                                        value={tempStep.role || ''}
                                                        onChange={(e) => setTempStep({...tempStep, role: e.target.value})}
                                                        placeholder="e.g. Manager"
                                                        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Type</label>
                                                    <div className="relative">
                                                        <select
                                                            value={tempStep.type || 'ACTION'}
                                                            onChange={(e) => setTempStep({...tempStep, type: e.target.value as 'ACTION' | 'DECISION'})}
                                                            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white appearance-none transition-all"
                                                        >
                                                            <option value="ACTION">Action Task</option>
                                                            <option value="DECISION">Decision (Gateway)</option>
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Description</label>
                                                <textarea
                                                    value={tempStep.description || ''}
                                                    onChange={(e) => setTempStep({...tempStep, description: e.target.value})}
                                                    placeholder="What happens in this step?"
                                                    className="w-full text-sm border border-slate-200 rounded-xl p-4 h-24 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                            <button onClick={handleCancelStep} className="text-xs font-bold text-slate-500 px-5 py-2.5 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                            <button onClick={handleSaveStep} className="text-xs font-bold bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">Save Changes</button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Card
                                    <div
                                        className={clsx(
                                            "w-full bg-white rounded-2xl border p-6 my-3 relative transition-all hover:shadow-xl cursor-pointer group/card",
                                            step.type === 'DECISION'
                                                ? "border-l-[6px] border-l-orange-400 border-y-slate-200 border-r-slate-200 hover:border-l-orange-500"
                                                : "border-l-[6px] border-l-blue-500 border-y-slate-200 border-r-slate-200 hover:border-l-blue-600"
                                        )}
                                        onClick={() => {
                                            setEditingStepId(step.stepId);
                                            setTempStep(step);
                                        }}
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 transition-colors",
                                                step.type === 'DECISION' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                {getIcon(step.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-lg font-bold text-slate-800 truncate">{step.name}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-300 tracking-wider">STEP {index + 1}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.stepId); }}
                                                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg hover:bg-red-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wide">
                                                        {step.role}
                                                    </span>
                                                    {step.type === 'DECISION' && (
                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 uppercase tracking-wide flex items-center gap-1">
                                                            <GitFork size={10} /> Gateway
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Insert Button (Bottom for last item) */}
                                {index === draftSteps.length - 1 && (
                                    <button
                                        onClick={() => handleAddStep(index + 1)}
                                        className="absolute -bottom-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:scale-110 transition-all shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        title="Insert Step Here"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* End Node (Always visible) */}
                        <div className="flex flex-col items-center mt-10 opacity-60">
                            <div className="w-4 h-4 bg-red-400 rounded-full ring-4 ring-red-100 mb-2"></div>
                            <span className="text-[10px] font-black text-red-500 tracking-widest bg-red-50 px-2 py-0.5 rounded-full">END</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}