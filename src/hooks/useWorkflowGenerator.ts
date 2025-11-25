import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { startProcessGeneration, getJobStatus } from '../api/workflow';

export const useWorkflowGenerator = () => {
    const [jobId, setJobId] = useState<string | null>(null);

    // 1. 작업 시작 (Trigger)
    const { mutate: startJob, isPending: isStarting } = useMutation({
        mutationFn: startProcessGeneration,
        onSuccess: (data) => {
            console.log('Job Started:', data.jobId);
            setJobId(data.jobId); // Job ID가 설정되면 폴링이 시작됨
        },
        onError: (error) => {
            console.error('Failed to start job:', error);
            alert('작업 요청에 실패했습니다.');
        }
    });

    // 2. 상태 폴링 (Smart Polling)
    const { data: jobStatus, error: pollError } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: () => getJobStatus(jobId!),
        enabled: !!jobId, // jobId가 있을 때만 실행
        refetchInterval: (query) => {
            const state = query.state.data?.state;

            // 완료(COMPLETED)되거나 실패(FAILED)하면 폴링 중단 (false 반환)
            if (state === 'COMPLETED' || state === 'FAILED') {
                return false;
            }
            // 그 외(PENDING, PROCESSING)에는 1초마다 재요청
            return 1000;
        },
    });

    // 3. UI 편의를 위한 상태 파생
    const isProcessing = jobStatus?.state === 'PENDING' || jobStatus?.state === 'PROCESSING';
    const isCompleted = jobStatus?.state === 'COMPLETED';

    return {
        startJob,        // 함수: 작업을 시작함
        jobStatus,       // 데이터: 현재 작업 상태 전체 (Process, Data, Form)
        isStarting,      // 상태: 시작 요청 중인지
        isProcessing,    // 상태: AI가 생성 중인지 (Polling 중)
        isCompleted,     // 상태: 완료되었는지
        error: pollError // 에러 객체
    };
};