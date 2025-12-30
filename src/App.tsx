import { useEffect, useState } from 'react';
// [Fix] 상대 경로를 확인하여 임포트 오류를 수정합니다.
// App.tsx가 src/ 폴더에 위치하므로 동일 레벨의 폴더들을 참조합니다.
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { JsonInspector } from './components/JsonInspector';
import { MainWorkspace } from './features/workflow/components/MainWorkspace';
import { CopilotPanel } from './features/workflow/components/copilot/CopilotPanel';

/**
 * 메인 애플리케이션 컴포넌트
 * [수정 사항] 사용자의 요청에 따라 중복되는 AiStatusWidget 팝업을 제거하여
 * 더 깔끔하고 전문적인 디자인을 구현했습니다.
 */
function App() {
    const [initialTopic, setInitialTopic] = useState('');
    const [inspectorOpen, setLocalInspectorOpen] = useState(false);

    const {
        jobStatus,
        isProcessReady,
        isSuggesting,
        isTransforming,
        isProcessing,
        isCompleted
    } = useWorkflowGenerator();

    const setProcess = useWorkflowStore((state) => state.setProcess);
    const setDataModel = useWorkflowStore((state) => state.setDataModel);
    const setFormDefinitions = useWorkflowStore((state) => state.setFormDefinitions);

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

    // 초기 변환 중이거나 프로세스가 준비되지 않은 상태에서 프로세싱 중일 때 캔버스에 로딩 오버레이 표시
    const showLoading = isTransforming || (isProcessing && !isProcessReady);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
            {/* [삭제됨] AiStatusWidget: 오른쪽 하단 팝업이 제거되었습니다.
               진행 상태는 이제 채팅창과 캔버스 오버레이를 통해 확인할 수 있습니다.
            */}

            <JsonInspector
                isOpen={inspectorOpen}
                onClose={() => setLocalInspectorOpen(false)}
                data={jobStatus || null}
            />

            <main className="flex flex-1 w-full h-full">
                {/* 왼쪽 영역: 워크스페이스 (캔버스, 데이터, 폼) */}
                <div className="flex-1 min-w-0 h-full relative z-0">
                    <MainWorkspace
                        jobStatus={jobStatus}
                        initialTopic={initialTopic}
                        isCompleted={isCompleted}
                        isInspectorOpen={inspectorOpen}
                        setInspectorOpen={setLocalInspectorOpen}
                        isSuggesting={isSuggesting}
                        handleTriggerSuggestion={() => {}}
                        showGeneratingOverlay={showLoading}
                    />
                </div>

                {/* 오른쪽 영역: AI 코파일럿 패널 */}
                <div className="w-[420px] flex-shrink-0 h-full border-l border-slate-200 z-10 shadow-xl bg-white">
                    <CopilotPanel />
                </div>
            </main>
        </div>
    );
}

export default App;