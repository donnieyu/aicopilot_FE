import { client } from './client';
import type { JobStatus, SuggestionResponse } from '../types/workflow';

/**
 * 1. 프로세스 생성 요청 (POST /api/copilot/start)
 * 반환값: { jobId: string, message: string }
 */
export const startProcessGeneration = async (prompt: string) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/start',
        { userPrompt: prompt }
    );
    return data;
};

/**
 * 2. 작업 상태 조회 (GET /api/copilot/status/{jobId})
 * 반환값: JobStatus (우리가 정의한 DTO)
 */
export const getJobStatus = async (jobId: string) => {
    const { data } = await client.get<JobStatus>(`/copilot/status/${jobId}`);
    return data;
};

/**
 * 3. AI 제안 요청 (POST /api/copilot/suggest)
 * focusNodeId와 현재 그래프 상태를 보내 다음 행동을 추천받음
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