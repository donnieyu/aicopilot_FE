import { useMutation, useQuery } from '@tanstack/react-query';
import {
    startProcessGeneration,
    transformProcess,
    getJobStatus,
    suggestNextSteps,
    chatWithAi
} from '../api/workflow';
import { useUiStore } from '../store/useUiStore';

/**
 * 전역 상태를 활용하여 여러 컴포넌트에서 동일한 작업을 추적하는 생성 훅
 */
export const useWorkflowGenerator = () => {
    const { currentJobId, setCurrentJobId } = useUiStore();

    // 1. 일반 텍스트 기반 생성
    const { mutateAsync: startJob, isPending: isStarting } = useMutation({
        mutationFn: startProcessGeneration,
        onSuccess: (data) => {
            setCurrentJobId(data.jobId);
        }
    });

    // 2. [Update] 지식 및 캔버스 기반 채팅 연동
    const { mutateAsync: startChatJob, isPending: isChatStarting } = useMutation({
        mutationFn: ({
                         prompt,
                         assetIds,
                         currentProcessJson
                     }: {
            prompt: string,
            assetIds: string[],
            currentProcessJson?: string
        }) => chatWithAi(prompt, assetIds, currentProcessJson),
        onSuccess: (data) => {
            if (data.jobId) {
                setCurrentJobId(data.jobId);
            }
        }
    });

    // 3. 리스트 -> 맵 변환
    const { mutate: startTransformation, isPending: isTransforming } = useMutation({
        mutationFn: transformProcess,
        onSuccess: (data) => {
            setCurrentJobId(data.jobId);
        }
    });

    // 4. 전역 Job ID 상태 폴링
    const { data: jobStatus, error: pollError } = useQuery({
        queryKey: ['jobStatus', currentJobId],
        queryFn: () => getJobStatus(currentJobId!),
        enabled: !!currentJobId,
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            if (state === 'COMPLETED' || state === 'FAILED') {
                return false;
            }
            return 1000;
        },
    });

    // 5. 파생 상태
    const isProcessing = jobStatus?.state === 'PENDING' || jobStatus?.state === 'PROCESSING';
    const isCompleted = jobStatus?.state === 'COMPLETED';
    const isProcessReady = !!jobStatus?.processResponse;

    const { mutateAsync: getSuggestions, isPending: isSuggesting } = useMutation({
        mutationFn: ({ graphJson, focusNodeId, jobId }: { graphJson: string, focusNodeId: string, jobId: string }) =>
            suggestNextSteps(graphJson, focusNodeId, jobId),
    });

    return {
        startJob,
        startChatJob,
        startTransformation,
        jobStatus,
        currentJobId,
        isStarting: isStarting || isChatStarting,
        isTransforming,
        isProcessing,
        isCompleted,
        isProcessReady,
        error: pollError,
        getSuggestions,
        isSuggesting,
        setJobId: setCurrentJobId
    };
};