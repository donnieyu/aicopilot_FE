import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { startProcessGeneration, getJobStatus, suggestNextSteps } from '../api/workflow';

export const useWorkflowGenerator = () => {
    const [jobId, setJobId] = useState<string | null>(null);

    // 1. 작업 시작
    const { mutate: startJob, isPending: isStarting } = useMutation({
        mutationFn: startProcessGeneration,
        onSuccess: (data) => {
            console.log('Job Started:', data.jobId);
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Failed to start job:', error);
            alert('작업 요청에 실패했습니다.');
        }
    });

    // 2. 상태 폴링
    const { data: jobStatus, error: pollError } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: () => getJobStatus(jobId!),
        enabled: !!jobId,
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            if (state === 'COMPLETED' || state === 'FAILED') {
                return false;
            }
            return 1000;
        },
    });

    // 3. 상태 파생
    const isProcessing = jobStatus?.state === 'PENDING' || jobStatus?.state === 'PROCESSING';
    const isCompleted = jobStatus?.state === 'COMPLETED';

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
        jobStatus,
        isStarting,
        isProcessing,
        isCompleted,
        error: pollError,
        getSuggestions,
        isSuggesting,
    };
};