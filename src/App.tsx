import { useState } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { Loader2, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

function App() {
    const [prompt, setPrompt] = useState('');
    const { startJob, jobStatus, isStarting, isProcessing, isCompleted } = useWorkflowGenerator();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        startJob(prompt);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                🏛️ AI Workflow Architect
            </h1>

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="어떤 프로세스를 만들고 싶으신가요? (예: 휴가 신청 프로세스)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isStarting || isProcessing}
                />
                <button
                    type="submit"
                    disabled={!prompt || isStarting || isProcessing}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {isStarting ? <Loader2 className="animate-spin" /> : '설계 시작'}
                </button>
            </form>

            {/* 상태 모니터링 패널 */}
            {(isProcessing || isCompleted) && jobStatus && (
                <div className="w-full max-w-2xl mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">작업 진행 상황</h2>
                        <span className={clsx(
                            "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
                            isProcessing && "bg-blue-100 text-blue-700",
                            isCompleted && "bg-green-100 text-green-700",
                            jobStatus.state === 'FAILED' && "bg-red-100 text-red-700"
                        )}>
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isCompleted && <CheckCircle className="w-4 h-4" />}
                            {jobStatus.state}
            </span>
                    </div>

                    {/* 진행 단계 표시줄 */}
                    <div className="space-y-4">
                        <StageItem
                            label="1. 프로세스 구조 설계 (Process)"
                            status={jobStatus.stageDurations?.PROCESS ? 'DONE' : 'WAITING'}
                            duration={jobStatus.stageDurations?.PROCESS}
                        />
                        <StageItem
                            label="2. 데이터 모델링 (Data Entity)"
                            status={jobStatus.stageDurations?.DATA ? 'DONE' : (jobStatus.stageDurations?.PROCESS ? 'PROCESSING' : 'WAITING')}
                            duration={jobStatus.stageDurations?.DATA}
                        />
                        <StageItem
                            label="3. 폼 디자인 (Form UX)"
                            status={jobStatus.stageDurations?.FORM ? 'DONE' : (jobStatus.stageDurations?.DATA ? 'PROCESSING' : 'WAITING')}
                            duration={jobStatus.stageDurations?.FORM}
                        />
                    </div>

                    {/* 결과 JSON 미리보기 (디버깅용) */}
                    <div className="mt-6 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
                        <pre>{JSON.stringify(jobStatus, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// 간단한 진행 단계 컴포넌트
function StageItem({ label, status, duration }: { label: string, status: string, duration?: number }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
                {status === 'DONE' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {status === 'PROCESSING' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                {status === 'WAITING' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                <span className={clsx("font-medium", status === 'WAITING' ? "text-gray-400" : "text-gray-700")}>
          {label}
        </span>
            </div>
            {duration && (
                <span className="text-xs text-gray-500 font-mono">
          {(duration / 1000).toFixed(1)}s
        </span>
            )}
        </div>
    );
}

export default App;