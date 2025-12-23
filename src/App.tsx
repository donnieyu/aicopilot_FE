import { useEffect, useState } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { useUiStore } from './store/useUiStore';
import { JsonInspector } from './components/JsonInspector';
import { GeneratingOverlay } from './features/workflow/components/GeneratingOverlay';
import { AiStatusWidget } from './features/workflow/components/AiStatusWidget';
import { MainWorkspace } from './features/workflow/components/MainWorkspace';
import { CopilotPanel } from './features/workflow/components/copilot/CopilotPanel';
import { useAutoAnalysis } from './hooks/useAutoAnalysis';

/**
 * 리팩토링된 메인 App 컴포넌트
 * - LandingPage 제거: Zero-Step Chat-Driven 인터페이스 구현
 * - 좌/우 2분할 Flex Layout (Workspace / Copilot)
 */
function App() {
    const [initialTopic, setInitialTopic] = useState('');
    const [inspectorOpen, setLocalInspectorOpen] = useState(false);

    // AI 워크플로우 생성 상태 관리
    const {
        jobStatus,
        isProcessReady,
        isSuggesting,
        isTransforming,
        isProcessing,
        isCompleted
    } = useWorkflowGenerator();

    // Zustand 스토어 액션
    const setProcess = useWorkflowStore((state) => state.setProcess);
    const setDataModel = useWorkflowStore((state) => state.setDataModel);
    const setFormDefinitions = useWorkflowStore((state) => state.setFormDefinitions);

    // 실시간 분석 Nudge (Shadow Architect)
    useAutoAnalysis();

    // 백엔드 작업 상태(JobStatus) 동기화
    useEffect(() => {
        if (jobStatus) {
            if (jobStatus.processResponse?.processName) {
                setInitialTopic(jobStatus.processResponse.processName);
            }

            if (jobStatus.processResponse) {
                setProcess(jobStatus.processResponse);
            }
            if (jobStatus.dataEntitiesResponse) {
                setDataModel(
                    jobStatus.dataEntitiesResponse.entities,
                    jobStatus.dataEntitiesResponse.groups
                );
            }
            if (jobStatus.formResponse?.formDefinitions) {
                setFormDefinitions(jobStatus.formResponse.formDefinitions);
            }
        }
    }, [jobStatus, setProcess, setDataModel, setFormDefinitions]);

    // 전체 로딩 상태 계산 (초기 맵 생성 시에만 오버레이 표시)
    const showLoading = isTransforming || (isProcessing && !isProcessReady);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            {/* 1. Global Overlays & Widgets */}
            <GeneratingOverlay
                isVisible={showLoading}
                message={jobStatus?.message || "AI Architect is working..."}
            />
            <AiStatusWidget status={jobStatus} message={jobStatus?.message || ''} />
            <JsonInspector
                isOpen={inspectorOpen}
                onClose={() => setLocalInspectorOpen(false)}
                data={jobStatus || null}
            />

            {/* 2. Main Layout (Flex Container) */}
            <main className="flex flex-1 w-full h-full">

                {/* [좌] Main Workspace Area: Canvas, Data, Form 탭 */}
                <div className="flex-1 min-w-0 h-full relative z-0">
                    <MainWorkspace
                        jobStatus={jobStatus}
                        initialTopic={initialTopic}
                        isCompleted={isCompleted}
                        isInspectorOpen={inspectorOpen}
                        setInspectorOpen={setLocalInspectorOpen}
                        isSuggesting={isSuggesting}
                        handleTriggerSuggestion={() => {}}
                    />
                </div>

                {/* [우] Persistent Copilot Panel: Fixed Width (450px) */}
                <div className="w-[450px] flex-shrink-0 h-full border-l border-slate-200 z-10 shadow-xl bg-white">
                    <CopilotPanel />
                </div>

            </main>
        </div>
    );
}

export default App;