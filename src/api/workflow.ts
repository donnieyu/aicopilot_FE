import { client } from './client';
import type { JobStatus, SuggestionResponse, ProcessDefinition, ProcessStep, AnalysisResult, FormDefinitions, DataEntitiesResponse, FormResponse } from '../types/workflow';

// ... (Existing methods)

/**
 * 1. 프로세스 생성 요청 (Mode A: Quick Start)
 */
export const startProcessGeneration = async (prompt: string) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/start',
        { userPrompt: prompt }
    );
    return data;
};

export const transformProcess = async (definition: ProcessDefinition) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/transform',
        definition
    );
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

export const analyzeProcess = async (graphSnapshot: any) => {
    const { data } = await client.post<AnalysisResult[]>('/copilot/analyze', graphSnapshot);
    return data;
};

/**
 * 7. [The Fixer] 에러 수정 요청 (Simulate Fix)
 * POST /api/copilot/analyze/fix
 * [Updated] Response type includes fixDescription
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
            timeout: 60000
        }
    );
    return data;
};

export const suggestFormDefinition = async (prompt: string) => {
    const { data } = await client.post<FormDefinitions>('/copilot/suggest/form', { prompt });
    return data;
};

export const suggestAutoDiscovery = async (processContext: any, existingEntities: any[]) => {
    const { data } = await client.post<DataEntitiesResponse>(
        '/copilot/suggest/data-model/auto-discovery',
        {
            processContext,
            existingEntities
        },
        {
            timeout: 60000
        }
    );
    return data;
};

export const suggestFormAutoDiscovery = async (processContext: any, existingEntities: any[], existingForms: any[]) => {
    const { data } = await client.post<FormResponse>(
        '/copilot/suggest/form/auto-discovery',
        {
            processContext,
            existingEntities,
            existingForms
        },
        {
            timeout: 60000
        }
    );
    return data;
};

/**
 * [New] Asset Analysis (File -> ProcessDefinition)
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
        timeout: 60000
    });
    return data;
};