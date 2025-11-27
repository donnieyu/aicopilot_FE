import { client } from './client';
import type { JobStatus, SuggestionResponse, ProcessDefinition } from '../types/workflow';

// ... (기존 API 유지) ...
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

// [Updated] Graph Suggestion (URL 변경 반영)
export const suggestNextSteps = async (
    currentGraphJson: string,
    focusNodeId: string,
    jobId: string
) => {
    // Controller URL 변경에 맞춰 /suggest/graph 사용 (하위 호환성을 위해 /suggest도 가능하지만 명시적 분리)
    const { data } = await client.post<SuggestionResponse>('/copilot/suggest/graph', {
        currentGraphJson,
        focusNodeId,
        jobId,
    });
    return data;
};

// [New] Outline Suggestion
export const suggestProcessOutline = async (topic: string, description: string) => {
    const { data } = await client.post<ProcessDefinition>('/copilot/suggest/outline', {
        topic,
        description
    });
    return data;
};