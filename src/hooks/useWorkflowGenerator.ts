import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    startProcessGeneration,
    transformProcess,
    getJobStatus,
    suggestNextSteps,
    chatWithAi // [Phase 4] 신규 API 임포트
} from '../api/workflow';

/**
 * [Phase 4] 워크플로우 생성 및 상태 관리를 위한 통합 커스텀 훅
 * - 일반 시작(Mode A), 변환(Mode B), 지식 기반 채팅 생성을 모두 지원합니다.
 */
export const useWorkflowGenerator = () => {
    const [jobId, setJobId] = useState<string | null>(null);

    // 1. [Mode A] 단순 텍스트 기반 프로세스 생성 시작
    const { mutateAsync: startJob, isPending: isStarting } = useMutation({
        mutationFn: startProcessGeneration,
        onSuccess: (data) => {
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Failed to start standard job:', error);
        }
    });

    // 2. [Phase 4] 채팅 기반 지식 컨텍스트 포함 프로세스 생성 시작
    const { mutateAsync: startChatJob, isPending: isChatStarting } = useMutation({
        mutationFn: ({ prompt, assetIds }: { prompt: string, assetIds: string[] }) =>
            chatWithAi(prompt, assetIds),
        onSuccess: (data) => {
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Failed to start chat-driven job:', error);
        }
    });

    // 3. [Mode B] 아웃라인 리스트를 프로세스 맵으로 변환
    const { mutate: startTransformation, isPending: isTransforming } = useMutation({
        mutationFn: transformProcess,
        onSuccess: (data) => {
            setJobId(data.jobId);
        }
    });

    // 4. 백엔드 작업 상태 Polling 로직
    const { data: jobStatus, error: pollError } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: () => getJobStatus(jobId!),
        enabled: !!jobId,
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            // 완료되거나 실패한 경우 폴링 중단
            if (state === 'COMPLETED' || state === 'FAILED') {
                return false;
            }
            return 1000; // 1초 간격 폴링
        },
    });

    // 5. 상태 변수 파생
    const isProcessing = jobStatus?.state === 'PENDING' || jobStatus?.state === 'PROCESSING';
    const isCompleted = jobStatus?.state === 'COMPLETED';

    // [Optimistic UI] 프로세스 맵 데이터가 응답에 포함되어 있다면 즉시 캔버스에 그릴 준비가 된 것으로 간주
    const isProcessReady = !!jobStatus?.processResponse;

    // AI 제안 (Node Selection 기반 Next Best Action)
    const { mutateAsync: getSuggestions, isPending: isSuggesting } = useMutation({
        mutationFn: ({ graphJson, focusNodeId, jobId }: { graphJson: string, focusNodeId: string, jobId: string }) =>
            suggestNextSteps(graphJson, focusNodeId, jobId),
        onError: (error) => {
            console.error('Failed to get AI suggestions:', error);
        }
    });

    return {
        startJob,           // 단순 생성
        startChatJob,       // [New] 지식 기반 채팅 생성
        startTransformation,// Mode B 변환
        jobStatus,          // 현재 진행 상태 데이터
        currentJobId: jobId,
        isStarting: isStarting || isChatStarting, // 통합 시작 중 상태
        isTransforming,
        isProcessing,
        isCompleted,
        isProcessReady,
        error: pollError,
        getSuggestions,
        isSuggesting,
    };
};