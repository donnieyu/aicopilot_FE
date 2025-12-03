import { client } from './client';
import type { JobStatus, SuggestionResponse, ProcessDefinition, ProcessStep, AnalysisResult, FormDefinitions, DataEntitiesResponse, FormResponse } from '../types/workflow';

// AI 생성 작업의 타임아웃 상수 (2분)
const AI_TIMEOUT = 120000;

/**
 * 1. 프로세스 생성 요청 (Mode A: Quick Start)
 * - 비동기 작업 시작 요청이므로 응답이 빠름 (기본 타임아웃 사용)
 */
export const startProcessGeneration = async (prompt: string) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/start',
        { userPrompt: prompt }
    );
    return data;
};

/**
 * 2. 프로세스 변환 요청 (Mode B)
 * - 비동기 작업 시작 요청이므로 응답이 빠름
 */
export const transformProcess = async (definition: ProcessDefinition) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/transform',
        definition
    );
    return data;
};

/**
 * 3. 작업 상태 조회 (Polling)
 * - 단순 조회이므로 응답이 빠름
 */
export const getJobStatus = async (jobId: string) => {
    const { data } = await client.get<JobStatus>(`/copilot/status/${jobId}`);
    return data;
};

/**
 * 4. 다음 단계 제안 (Synchronous AI Generation)
 */
export const suggestNextSteps = async (
    currentGraphJson: string,
    focusNodeId: string,
    jobId: string
) => {
    const { data } = await client.post<SuggestionResponse>('/copilot/suggest/graph', {
        currentGraphJson,
        focusNodeId,
        jobId,
    }, { timeout: AI_TIMEOUT }); // [Change] 타임아웃 적용
    return data;
};

/**
 * 5. [Error Fix Target] 프로세스 아웃라인 제안 (Synchronous AI Generation)
 */
export const suggestProcessOutline = async (topic: string, description: string) => {
    const { data } = await client.post<ProcessDefinition>('/copilot/suggest/outline', {
        topic,
        description
    }, { timeout: AI_TIMEOUT }); // [Change] 타임아웃 적용 (에러 발생 지점 해결)
    return data;
};

/**
 * 6. 단계 상세 내용 제안 (Synchronous AI Generation)
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
    }, { timeout: AI_TIMEOUT }); // [Change] 타임아웃 적용
    return data;
};

/**
 * 7. 프로세스 분석 (Synchronous AI Generation)
 */
export const analyzeProcess = async (graphSnapshot: any) => {
    const { data } = await client.post<AnalysisResult[]>('/copilot/analyze', graphSnapshot, {
        timeout: AI_TIMEOUT // [Change] 타임아웃 적용
    });
    return data;
};

/**
 * 8. [The Fixer] 에러 수정 요청 (Simulate Fix)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fixProcessGraph = async (graphSnapshot: any, error: AnalysisResult) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await client.post<{ nodes: any[], edges: any[], fixDescription?: string }>(
        '/copilot/analyze/fix',
        {
            graphSnapshot,
            error
        },
        {
            timeout: AI_TIMEOUT // [Change] 60s -> 120s로 통일
        }
    );
    return data;
};

/**
 * 9. 폼 정의 제안
 */
export const suggestFormDefinition = async (prompt: string) => {
    const { data } = await client.post<FormDefinitions>('/copilot/suggest/form', { prompt }, {
        timeout: AI_TIMEOUT
    });
    return data;
};

/**
 * 10. 데이터 자동 발견 (Auto-Discovery)
 */
export const suggestAutoDiscovery = async (processContext: any, existingEntities: any[]) => {
    const { data } = await client.post<DataEntitiesResponse>(
        '/copilot/suggest/data-model/auto-discovery',
        {
            processContext,
            existingEntities
        },
        {
            timeout: AI_TIMEOUT // [Change] 60s -> 120s로 통일
        }
    );
    return data;
};

/**
 * 11. 폼 자동 발견 (Auto-Discovery)
 */
export const suggestFormAutoDiscovery = async (processContext: any, existingEntities: any[], existingForms: any[]) => {
    const { data } = await client.post<FormResponse>(
        '/copilot/suggest/form/auto-discovery',
        {
            processContext,
            existingEntities,
            existingForms
        },
        {
            timeout: AI_TIMEOUT // [Change] 60s -> 120s로 통일
        }
    );
    return data;
};

/**
 * 12. [New] Asset Analysis (File -> ProcessDefinition)
 * 업로드된 파일을 분석하여 바로 프로세스 정의(토픽, 스텝)를 반환합니다.
 */
export const analyzeAsset = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // [Fix] Content-Type을 null로 설정하여 client 인스턴스의 기본값(application/json)을 제거
    // 이를 통해 브라우저가 자동으로 'multipart/form-data; boundary=...' 헤더를 설정하도록 함
    const { data } = await client.post<ProcessDefinition>('/copilot/analyze/asset', formData, {
        headers: {
            'Content-Type': null
        } as any,
        timeout: AI_TIMEOUT // [Change] 60s -> 120s로 통일 (이미지 분석은 시간이 오래 걸림)
    });
    return data;
};