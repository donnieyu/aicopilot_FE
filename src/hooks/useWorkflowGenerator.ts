import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    startProcessGeneration,
    transformProcess,
    getJobStatus,
    suggestNextSteps,
    chatWithAi
} from '../api/workflow';

/**
 * Integrated custom hook for workflow generation and state management.
 * All user-facing error messages have been translated to English.
 */
export const useWorkflowGenerator = () => {
    const [jobId, setJobId] = useState<string | null>(null);

    // 1. [Mode A] Start simple text-based process generation
    const { mutateAsync: startJob, isPending: isStarting } = useMutation({
        mutationFn: startProcessGeneration,
        onSuccess: (data) => {
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Failed to start standard job:', error);
            alert('Failed to request the design task. Please check your connection.');
        }
    });

    // 2. Chat-based generation with knowledge context
    const { mutateAsync: startChatJob, isPending: isChatStarting } = useMutation({
        mutationFn: ({ prompt, assetIds }: { prompt: string, assetIds: string[] }) =>
            chatWithAi(prompt, assetIds),
        onSuccess: (data) => {
            if (data.jobId) {
                setJobId(data.jobId);
            }
        },
        onError: (error) => {
            console.error('Failed to start chat interaction:', error);
            alert('An error occurred during chat interaction.');
        }
    });

    // 3. [Mode B] Transform outline list into process map
    const { mutate: startTransformation, isPending: isTransforming } = useMutation({
        mutationFn: transformProcess,
        onSuccess: (data) => {
            setJobId(data.jobId);
        },
        onError: (error) => {
            console.error('Transformation failed:', error);
            alert('Failed to transform the list into a map.');
        }
    });

    // 4. Backend status Polling logic
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

    // 5. Derived state variables
    const isProcessing = jobStatus?.state === 'PENDING' || jobStatus?.state === 'PROCESSING';
    const isCompleted = jobStatus?.state === 'COMPLETED';
    const isProcessReady = !!jobStatus?.processResponse;

    // AI suggestions based on node selection
    const { mutateAsync: getSuggestions, isPending: isSuggesting } = useMutation({
        mutationFn: ({ graphJson, focusNodeId, jobId }: { graphJson: string, focusNodeId: string, jobId: string }) =>
            suggestNextSteps(graphJson, focusNodeId, jobId),
        onError: (error) => {
            console.error('Failed to get AI suggestions:', error);
        }
    });

    return {
        startJob,
        startChatJob,
        startTransformation,
        jobStatus,
        currentJobId: jobId,
        isStarting: isStarting || isChatStarting,
        isTransforming,
        isProcessing,
        isCompleted,
        isProcessReady,
        error: pollError,
        getSuggestions,
        isSuggesting,
        setJobId
    };
};