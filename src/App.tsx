import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { Loader2, CheckCircle, Wand2, Code, ArrowRight, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

function App() {
    const [prompt, setPrompt] = useState('');
    const [isInspectorOpen, setInspectorOpen] = useState(false);

    const { startJob, jobStatus, isStarting, isProcessing, isCompleted } = useWorkflowGenerator();

    // [Optimized] 상태 구독 최적화 (Shallow Comparison)
    const setProcess = useWorkflowStore((state) => state.setProcess);
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);

    // [Fix] 무한 루프 방지: jobStatus.processResponse가 실제로 변경되었을 때만 호출
    // JSON.stringify 비교는 무거울 수 있으므로, jobStatus.version이나 jobId 등을 키로 사용하는 것이 좋음.
    // 여기서는 jobStatus가 변경될 때마다 체크하되, 내부적으로 이미 같은 프로세스라면 무시하도록
    // useWorkflowStore의 setProcess에서 currentProcess 비교 로직을 넣는 것도 방법이지만,
    // 간단하게 useEffect 의존성을 jobStatus.processResponse 로 한정.
    useEffect(() => {
        if (isCompleted && jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompleted, jobStatus?.processResponse]);
    // 주의: jobStatus 전체를 넣으면 폴링 때마다 계속 실행될 수 있음. processResponse 객체 참조 변경 시에만 실행.

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        startJob(prompt);
    };

    if (isCompleted) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10 relative">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏛️</span>
                        <div>
                            <h1 className="font-bold text-gray-800 text-lg">
                                {jobStatus?.processResponse?.processName || 'Untitled Process'}
                            </h1>
                            <p className="text-xs text-gray-500">AI Architect Ver 5.2</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button
                                onClick={() => setLayoutDirection('LR')}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    layoutDirection === 'LR' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                                title="가로 흐름 (Left to Right)"
                            >
                                <ArrowRight size={16} />
                                LR
                            </button>
                            <button
                                onClick={() => setLayoutDirection('TB')}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    layoutDirection === 'TB' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                                title="세로 흐름 (Top to Bottom)"
                            >
                                <ArrowDown size={16} />
                                TB
                            </button>
                        </div>

                        <div className="h-6 w-px bg-gray-300 mx-1" />

                        <button
                            onClick={() => setInspectorOpen(true)}
                            className={clsx(
                                "flex items-center gap-2 text-sm px-3 py-1.5 border rounded-lg transition-colors",
                                isInspectorOpen ? "bg-blue-50 text-blue-600 border-blue-200" : "text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <Code size={16} />
                            JSON 결과
                        </button>

                        <div className="h-6 w-px bg-gray-300 mx-1" />

                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                        >
                            새로 만들기
                        </button>
                    </div>
                </header>

                <div className="flex-1 relative">
                    <WorkflowCanvas />
                    <JsonInspector
                        isOpen={isInspectorOpen}
                        onClose={() => setInspectorOpen(false)}
                        data={jobStatus || null}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center justify-center">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                    <Wand2 className="w-8 h-8 text-blue-600" />
                    AI Workflow Architect
                </h1>
                <p className="text-gray-500">당신의 아이디어를 실행 가능한 프로세스로 설계해 드립니다.</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex gap-2 mb-8">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="어떤 프로세스를 만들고 싶으신가요? (예: 비용 처리 및 승인 프로세스)"
                    className="flex-1 px-6 py-4 text-lg rounded-lg focus:outline-none placeholder:text-gray-300"
                    disabled={isStarting || isProcessing}
                />
                <button
                    type="submit"
                    disabled={!prompt || isStarting || isProcessing}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all"
                >
                    {isStarting ? <Loader2 className="animate-spin" /> : '설계'}
                </button>
            </form>

            {(isProcessing || isStarting) && (
                <div className="w-full max-w-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>AI가 프로세스를 분석 중입니다...</span>
                        {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </div>

                    <StageItem
                        label="1. 프로세스 구조 설계 (Process)"
                        status={jobStatus?.stageDurations?.PROCESS ? 'DONE' : 'PROCESSING'}
                    />
                    <StageItem
                        label="2. 데이터 모델링 (Data Entity)"
                        status={jobStatus?.stageDurations?.DATA ? 'DONE' : (jobStatus?.stageDurations?.PROCESS ? 'PROCESSING' : 'WAITING')}
                    />
                    <StageItem
                        label="3. 폼 디자인 (Form UX)"
                        status={jobStatus?.stageDurations?.FORM ? 'DONE' : (jobStatus?.stageDurations?.DATA ? 'PROCESSING' : 'WAITING')}
                    />
                </div>
            )}
        </div>
    );
}

function StageItem({ label, status }: { label: string, status: string }) {
    return (
        <div className={clsx(
            "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
            status === 'DONE' ? "bg-white border-green-200 shadow-sm" :
                status === 'PROCESSING' ? "bg-white border-blue-200 shadow-md scale-105" : "bg-gray-50 border-transparent opacity-50"
        )}>
            <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                status === 'DONE' ? "bg-green-100 text-green-600" :
                    status === 'PROCESSING' ? "bg-blue-100 text-blue-600" : "bg-gray-200"
            )}>
                {status === 'DONE' ? <CheckCircle size={18} /> :
                    status === 'PROCESSING' ? <Loader2 size={18} className="animate-spin" /> :
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />}
            </div>
            <span className={clsx("font-medium", status === 'WAITING' ? "text-gray-400" : "text-gray-700")}>
        {label}
      </span>
        </div>
    );
}

export default App;