import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { SuggestionPanel } from './features/workflow/components/SuggestionPanel';
// [Fix] Send 제거, CheckCircle 추가
import { Loader2, Wand2, Code, ArrowRight, ArrowDown, Sparkles, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import type { NodeSuggestion } from './types/workflow';
import type { Node } from 'reactflow';

function App() {
    const [prompt, setPrompt] = useState('');
    const [isInspectorOpen, setInspectorOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const {
        startJob, jobStatus, isCompleted, // [Fix] 미사용 변수(isStarting, isProcessing) 제거
        getSuggestions, isSuggesting
    } = useWorkflowGenerator();

    const setProcess = useWorkflowStore((state) => state.setProcess);
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);
    const applySuggestion = useWorkflowStore((state) => state.applySuggestion);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCompleted && jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
        }
    }, [isCompleted, jobStatus?.processResponse, setProcess]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setHasStarted(true);
        startJob(prompt);
    };

    const handleNodeClick = async (_event: React.MouseEvent, node: Node) => {
        if (selectedNodeId === node.id && showSuggestionPanel) {
            setShowSuggestionPanel(false);
            return;
        }
        setSelectedNodeId(node.id);
        setShowSuggestionPanel(true);
        setSuggestions([]);

        const { nodes, edges } = useWorkflowStore.getState();
        const simplifiedNodes = nodes.map(n => ({
            id: n.id, type: n.type, data: { label: n.data.label, swimlaneId: n.data.swimlaneId, configuration: n.data.configuration }
        }));
        const simplifiedEdges = edges.map(e => ({ source: e.source, target: e.target, label: e.label }));
        const graphContext = JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges });

        try {
            const response = await getSuggestions({ graphJson: graphContext, focusNodeId: node.id });
            if (response?.suggestions) setSuggestions(response.suggestions);
        } catch (e) {
            console.error(e);
            const mockSuggestions: NodeSuggestion[] = [
                {
                    title: "담당자 승인 단계 추가",
                    reason: "비용 요청 제출 후에는 일반적으로 관리자의 승인이 필요합니다.",
                    type: "USER_TASK",
                    configuration: { configType: "USER_TASK_CONFIG", participantRole: "Manager", isApproval: true, formKey: "approval_form" },
                    inputMapping: { "request_id": `{{ ${node.id}.id }}`, "amount": `{{ ${node.id}.amount }}` }
                },
                {
                    title: "이메일 알림 발송",
                    reason: "요청 접수 확인을 위해 신청자에게 이메일을 발송합니다.",
                    type: "SERVICE_TASK",
                    configuration: { configType: "EMAIL_CONFIG", templateId: "receipt_notification", subject: "요청이 접수되었습니다." },
                    inputMapping: { "recipient": `{{ ${node.id}.applicant_email }}` }
                }
            ];
            setSuggestions(mockSuggestions);
        }
    };

    const handleApplySuggestion = (suggestion: NodeSuggestion) => {
        if (selectedNodeId) {
            applySuggestion(suggestion, selectedNodeId);
            setShowSuggestionPanel(false);
            setSuggestions([]);
        }
    };

    // [UX] 초기 화면 (Start Screen)
    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6 transition-all duration-500">
                <div className="w-full max-w-3xl flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
                            <Wand2 className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                            AI Workflow Architect
                        </h1>
                        <p className="text-lg text-slate-500 max-w-xl mx-auto">
                            복잡한 비즈니스 프로세스, 말 한마디로 설계하세요.<br/>
                            AI가 구조 설계부터 데이터 모델링, 폼 디자인까지 한 번에 완성합니다.
                        </p>
                    </div>

                    <div className="w-full relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <form onSubmit={handleSubmit} className="relative flex items-center bg-white rounded-xl p-2 shadow-2xl border border-slate-100">
                            <div className="pl-4 pr-2 text-slate-400">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="예: 휴가 신청 및 승인 프로세스를 만들어줘"
                                className="flex-1 py-4 px-2 text-lg outline-none text-slate-700 placeholder:text-slate-300 bg-transparent"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!prompt.trim()}
                                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all duration-200"
                            >
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </form>
                    </div>

                    <div className="flex gap-3 text-sm text-slate-400">
                        <span className="px-3 py-1 bg-slate-100 rounded-full">비용 처리 프로세스</span>
                        <span className="px-3 py-1 bg-slate-100 rounded-full">신규 입사자 온보딩</span>
                        <span className="px-3 py-1 bg-slate-100 rounded-full">계약서 검토 요청</span>
                    </div>
                </div>
            </div>
        );
    }

    // [UX] 작업 화면 (Loading or Editor)
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            {/* Header (항상 표시) */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm leading-tight">
                            {isCompleted ? (jobStatus?.processResponse?.processName || 'Untitled Process') : 'Designing Process...'}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium">AI Architect Ver 5.2</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Loading Indicator in Header */}
                    {!isCompleted && (
                        <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            <span>
                                {jobStatus?.stageDurations?.FORM ? 'Finalizing UX...' :
                                    jobStatus?.stageDurations?.DATA ? 'Designing Forms...' :
                                        jobStatus?.stageDurations?.PROCESS ? 'Modeling Data...' : 'Architecting Process...'}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setLayoutDirection('LR')}
                            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'LR' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            <ArrowRight size={14} /> LR
                        </button>
                        <button
                            onClick={() => setLayoutDirection('TB')}
                            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'TB' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            <ArrowDown size={14} /> TB
                        </button>
                    </div>
                    <div className="h-5 w-px bg-slate-300 mx-1" />
                    <button
                        onClick={() => setInspectorOpen(true)}
                        className={clsx("flex items-center gap-2 text-xs font-bold px-3 py-1.5 border rounded-lg transition-colors", isInspectorOpen ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 border-slate-200 hover:bg-slate-50")}
                    >
                        <Code size={14} /> JSON
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        New
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Loading Overlay (완료 전까지 캔버스 위를 덮음) */}
                {!isCompleted && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="text-center space-y-6 max-w-md">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                <Wand2 className="absolute inset-0 m-auto text-blue-600 w-8 h-8 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">AI가 프로세스를 설계 중입니다</h2>
                                <p className="text-slate-500 text-sm">{prompt}</p>
                            </div>
                            {/* Progress Steps (Visual Only) */}
                            <div className="flex justify-between w-full px-8 pt-4">
                                <StepDot active={true} completed={!!jobStatus?.stageDurations?.PROCESS} label="Process" />
                                <div className={clsx("flex-1 h-0.5 mt-2.5 mx-2 transition-colors duration-500", jobStatus?.stageDurations?.PROCESS ? "bg-blue-500" : "bg-slate-200")} />
                                <StepDot active={!!jobStatus?.stageDurations?.PROCESS} completed={!!jobStatus?.stageDurations?.DATA} label="Data" />
                                <div className={clsx("flex-1 h-0.5 mt-2.5 mx-2 transition-colors duration-500", jobStatus?.stageDurations?.DATA ? "bg-blue-500" : "bg-slate-200")} />
                                <StepDot active={!!jobStatus?.stageDurations?.DATA} completed={!!jobStatus?.stageDurations?.FORM} label="Form" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas (항상 렌더링되지만 로딩 중에는 가려짐) */}
                <div className={clsx("w-full h-full transition-opacity duration-700", isCompleted ? "opacity-100" : "opacity-0 scale-95")}>
                    <WorkflowCanvas onNodeClick={handleNodeClick} />
                </div>

                {/* Side Panels */}
                <JsonInspector
                    isOpen={isInspectorOpen}
                    onClose={() => setInspectorOpen(false)}
                    data={jobStatus || null}
                />

                {showSuggestionPanel && (
                    <SuggestionPanel
                        suggestions={suggestions}
                        isLoading={isSuggesting}
                        onApply={handleApplySuggestion}
                        onClose={() => setShowSuggestionPanel(false)}
                    />
                )}
            </div>
        </div>
    );
}

function StepDot({ active, completed, label }: { active: boolean, completed: boolean, label: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={clsx(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                completed ? "bg-blue-600 text-white scale-110" :
                    active ? "bg-white border-2 border-blue-600 text-blue-600 animate-pulse" : "bg-slate-200 text-slate-400"
            )}>
                {/* [Check] CheckCircle이 import 되어 에러 해결됨 */}
                {completed && <CheckCircle size={12} />}
            </div>
            <span className={clsx("text-xs font-medium transition-colors duration-300", active || completed ? "text-blue-600" : "text-slate-400")}>
                {label}
            </span>
        </div>
    );
}

export default App;