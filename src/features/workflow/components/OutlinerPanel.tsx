import { LayoutTemplate, X, Play, Plus, GitFork, Settings, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { ProcessResponse, ProcessDefinition } from '../../../types/workflow';
import { useOutliner } from './outliner/useOutliner';
import { OutlinerHeader } from './outliner/OutlinerHeader';
import { TemplateSelector } from './outliner/TemplateSelector';
import { ContextInput } from './outliner/ContextInput';
import { StepCard } from './outliner/StepCard';

interface OutlinerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    process: ProcessResponse | null;
    onTransform?: (definition: ProcessDefinition) => void;
    initialTopic?: string;
    mode?: 'FULL' | 'SIDE';
}

export function OutlinerPanel({ process, onTransform, initialTopic = '', mode = 'FULL', isOpen, onClose }: OutlinerPanelProps) {
    const {
        topic, setTopic,
        description, setDescription,
        draftSteps,
        isSuggesting,
        isStepSuggesting, // [New]
        editingStepId,
        tempStep,
        generateWithAI,
        autoFillStep, // [New]
        addStep,
        deleteStep,
        saveStep,
        cancelStep,
        startEditing,
        updateTempStep
    } = useOutliner(process, initialTopic);

    const handleTransform = () => {
        if (onTransform) {
            onTransform({ topic, steps: draftSteps });
        }
    };

    const isSideMode = mode === 'SIDE';

    return (
        <div className={clsx(
            "bg-slate-50 flex flex-col overflow-hidden transition-all duration-300",
            isSideMode
                ? clsx("fixed inset-y-0 left-0 z-40 border-r border-slate-200 shadow-2xl w-[400px] bg-white", isOpen ? "translate-x-0" : "-translate-x-full")
                : "w-full h-full lg:flex-row animate-in fade-in duration-500"
        )}>

            {/* LEFT PANEL */}
            <div className={clsx(
                "flex flex-col border-b lg:border-b-0 border-slate-200 relative z-20 shadow-sm",
                isSideMode ? "h-auto flex-shrink-0 bg-white" : "w-full lg:w-[30%] h-full lg:border-r bg-slate-50/50"
            )}>
                {isSideMode ? (
                    <div className="p-6 pb-2 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <LayoutTemplate size={20} className="text-blue-600"/>
                            Outliner
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <OutlinerHeader
                        topic={topic}
                        onTopicChange={setTopic}
                        onBack={() => window.location.reload()}
                    />
                )}

                <div className={clsx("flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar", isSideMode && "max-h-[40vh]")}>
                    {!isSideMode && (
                        <TemplateSelector
                            topic={topic}
                            onSelect={setDescription}
                            selectedDesc={description}
                        />
                    )}

                    <ContextInput
                        description={description}
                        onChange={setDescription}
                        onGenerate={generateWithAI}
                        isGenerating={isSuggesting}
                        isDisabled={!topic || !description || isSuggesting}
                    />
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className={clsx(
                "flex-1 flex flex-col h-full overflow-hidden bg-white relative",
                isSideMode ? "bg-white" : "lg:w-[70%]"
            )}>

                {/* Timeline Header */}
                {!isSideMode && (
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
                )}

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
                            <div className="py-20 text-center w-full relative z-10 animate-in fade-in zoom-in-95 duration-300">
                                <div className="inline-flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-white w-full max-w-md hover:border-blue-300 transition-colors group cursor-pointer" onClick={() => addStep(0)}>
                                    <div className="p-4 bg-slate-50 rounded-full mb-4 group-hover:bg-blue-50 transition-colors">
                                        <Settings size={32} className="text-slate-300 group-hover:text-blue-400" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-600 mb-2 group-hover:text-blue-600">Timeline is Empty</p>
                                    <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                                        Use the AI panel on the left to auto-draft,<br/>
                                        or start building manually.
                                    </p>
                                    <button
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 group-hover:text-blue-600 group-hover:border-blue-300 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <Plus size={18} />
                                        Add First Step Manually
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isSuggesting && (
                            <div className="py-20 flex flex-col items-center justify-center animate-pulse">
                                <div className="bg-white p-4 rounded-full shadow-lg mb-4">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                                <span className="text-sm font-bold text-slate-500">AI is drafting steps...</span>
                            </div>
                        )}

                        {/* Steps List */}
                        {draftSteps.map((step, index) => (
                            <StepCard
                                key={step.stepId || index}
                                step={step}
                                index={index}
                                // SIDE 모드에서는 편집 불가
                                isEditing={editingStepId === step.stepId && !isSideMode}
                                tempStep={tempStep}
                                onEditStart={() => !isSideMode && startEditing(step.stepId, step)}
                                onEditChange={updateTempStep}
                                onSave={saveStep}
                                onCancel={cancelStep}
                                onDelete={() => deleteStep(step.stepId)}
                                // Handlers
                                onAddBefore={() => addStep(index)}
                                onAddAfter={() => addStep(index + 1)}
                                isLast={index === draftSteps.length - 1}
                                // AI Auto-Fill
                                onAutoFill={() => autoFillStep(index)}
                                isStepSuggesting={isStepSuggesting}
                            />
                        ))}

                        {/* End Node */}
                        <div className="flex flex-col items-center pt-10 opacity-60">
                            <div className="w-4 h-4 bg-red-400 rounded-full ring-4 ring-red-100 mb-2"></div>
                            <span className="text-[10px] font-black text-red-500 tracking-widest bg-red-50 px-2 py-0.5 rounded-full">END</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}