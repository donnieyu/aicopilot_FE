import { client } from './client';
import type { JobStatus, SuggestionResponse, ProcessDefinition, ProcessStep } from '../types/workflow';

// ... (Existing APIs) ...
export const startProcessGeneration = async (prompt: string) => {
    const { data } = await client.post<{ jobId: string; message: string }>('/copilot/start', { userPrompt: prompt });
    return data;
};

export const transformProcess = async (definition: ProcessDefinition) => {
    const { data } = await client.post<{ jobId: string; message: string }>('/copilot/transform', definition);
    return data;
};

export const getJobStatus = async (jobId: string) => {
    const { data } = await client.get<JobStatus>(`/copilot/status/${jobId}`);
    return data;
};

export const suggestNextSteps = async (
    currentGraphJson: string,
    focusNodeId: string,
    jobId: string
) => {
    const { data } = await client.post<SuggestionResponse>('/copilot/suggest/graph', {
        currentGraphJson,
        focusNodeId,
        jobId,
    });
    return data;
};

export const suggestProcessOutline = async (topic: string, description: string) => {
    const { data } = await client.post<ProcessDefinition>('/copilot/suggest/outline', {
        topic,
        description
    });
    return data;
};

// [New] Suggest details for a single step
export const suggestStepDetail = async (topic: string, context: string, stepIndex: number) => {
    // 백엔드 API가 아직 없다면 Mocking하거나, 추후 백엔드 구현 필요
    // 여기서는 실제 API 호출 구조를 잡아둡니다.
    const { data } = await client.post<ProcessStep>('/copilot/suggest/step', {
        topic,
        context,
        stepIndex
    });
    return data;
};