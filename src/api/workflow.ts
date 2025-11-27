import { client } from './client';
import type { JobStatus, SuggestionResponse, ProcessDefinition, ProcessStep, AnalysisResult, FormDefinitions } from '../types/workflow';

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
    focusNodeId: string,
    jobId: string
) => {
    // AI 추론은 시간이 걸릴 수 있으므로 30초 타임아웃 설정
    const { data } = await client.post<SuggestionResponse>(
        '/copilot/suggest/graph',
        { currentGraphJson, focusNodeId, jobId },
        { timeout: 30000 }
    );
    return data;
};

/**
 * 4. 아웃라인 생성 요청
 * POST /api/copilot/suggest/outline
 */
export const suggestProcessOutline = async (topic: string, description: string) => {
    const { data } = await client.post<ProcessDefinition>('/copilot/suggest/outline', {
        topic,
        description
    });
    return data;
};

/**
 * 5. 단일 스텝 상세 제안 요청 (Micro-Assistant)
 * POST /api/copilot/suggest/step
 */
export const suggestStepDetail = async (
    topic: string,
    context: string,
    stepIndex: number,
    currentSteps: { name: string; role: string }[]
) => {
    const { data } = await client.post<ProcessStep>('/copilot/suggest/step', {
        topic,
        context,
        stepIndex,
        currentSteps
    });
    return data;
};

/**
 * 6. [Shadow Architect] 구조 분석 요청
 * POST /api/copilot/analyze
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const analyzeProcess = async (graphSnapshot: any) => {
    const { data } = await client.post<AnalysisResult[]>('/copilot/analyze', graphSnapshot);
    return data;
};

/**
 * 7. [New] 폼 생성 제안 요청
 * POST /api/copilot/suggest/form
 * [Fix] AI 생성이 오래 걸릴 수 있으므로 타임아웃을 60초로 설정
 */
export const suggestFormDefinition = async (prompt: string) => {
    const { data } = await client.post<FormDefinitions>(
        '/copilot/suggest/form',
        { prompt },
        { timeout: 60000 } // 60s Timeout Override
    );
    return data;
};