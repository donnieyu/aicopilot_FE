import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { startProcessGeneration, transformProcess, getJobStatus, suggestNextSteps } from '../api/workflow';
// [Fix] 사용하지 않는 ProcessDefinition import 제거

export const useWorkflowGenerator = () => {
    const [jobId, setJobId] = useState<string | null>(null);

    // 1. [Mode A] 작업 시작
    const { mutate: startJob, isPending: isStarting } = useMutation({
        mutationFn: startProcessGeneration,
        onSuccess: (data) => {
            console.log('Mode A Started:', data.jobId);
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Failed to start job:', error);
            alert('작업 요청에 실패했습니다.');
        }
    });

    // 2. [Mode B] 변환 시작 (Outliner -> Map)
    const { mutate: startTransformation, isPending: isTransforming } = useMutation({
        mutationFn: transformProcess,
        onSuccess: (data) => {
            console.log('Mode B Started:', data.jobId);
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Failed to start transformation:', error);
            alert('변환 요청에 실패했습니다.');
        }
    });

    // 3. 상태 폴링
    const { data: jobStatus, error: pollError } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: () => getJobStatus(jobId!),
        enabled: !!jobId,
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            if (state === 'COMPLETED' || state === 'FAILED') {
                return false; // Stop polling
            }
            return 1000; // Poll every 1s
        },
    });

    // 4. 상태 파생
    const isProcessing = jobStatus?.state === 'PENDING' || jobStatus?.state === 'PROCESSING';
    const isCompleted = jobStatus?.state === 'COMPLETED';

    // [Optimistic UI] 프로세스 맵이 준비되었는지 여부 (완료 전이라도 true일 수 있음)
    const isProcessReady = !!jobStatus?.processResponse;

    // [New] AI 제안 요청
    const { mutateAsync: getSuggestions, isPending: isSuggesting } = useMutation({
        mutationFn: ({ graphJson, focusNodeId }: { graphJson: string, focusNodeId: string }) =>
            suggestNextSteps(graphJson, focusNodeId),
        onError: (error) => {
            console.error('Failed to get suggestions:', error);
        }
    });

    return {
        startJob,
        startTransformation, // New
        jobStatus,
        isStarting,
        isTransforming, // New
        isProcessing,
        isCompleted,
        isProcessReady, // New
        error: pollError,
        getSuggestions,
        isSuggesting,
    };
};