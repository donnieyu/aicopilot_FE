import { client } from './client';
import type { JobStatus, SuggestionResponse, ProcessDefinition } from '../types/workflow';

/**
 * 1. 프로세스 생성 요청 (Mode A: Quick Start)
 * POST /api/copilot/start
 */
export const startProcessGeneration = async (prompt: string) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/start',
        { userPrompt: prompt }
    );
    return data;
};

/**
 * 1-2. 구조적 변환 요청 (Mode B: Transformation)
 * POST /api/copilot/transform
 */
export const transformProcess = async (definition: ProcessDefinition) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/transform',
        definition
    );
    return data;
};

/**
 * 2. 작업 상태 조회 (Polling)
 * GET /api/copilot/status/{jobId}
 */
export const getJobStatus = async (jobId: string) => {
    const { data } = await client.get<JobStatus>(`/copilot/status/${jobId}`);
    return data;
};

/**
 * 3. AI 제안 요청 (On-Demand)
 * POST /api/copilot/suggest
 */
export const suggestNextSteps = async (
    currentGraphJson: string,
    focusNodeId: string
) => {
    const { data } = await client.post<SuggestionResponse>('/copilot/suggest', {
        currentGraphJson,
        focusNodeId,
    });
    return data;
};