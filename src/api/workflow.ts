import { client } from './client';
import type {
    JobStatus,
    SuggestionResponse,
    ProcessDefinition,
    ProcessStep,
    AnalysisResult,
    FormDefinitions,
    DataEntitiesResponse,
    FormResponse
} from '../types/workflow';

/**
 * AI 생성 작업 및 자산 분석을 위한 타임아웃 (2분)
 */
const AI_TIMEOUT = 120000;

/**
 * [Phase 2] Copilot Chat API
 * 사용자 프롬프트와 선택된 지식(Asset) ID 목록을 전달하여 프로세스를 생성하거나 수정합니다.
 */
export const chatWithAi = async (userPrompt: string, selectedAssetIds: string[]) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/chat',
        {
            userPrompt,
            selectedAssetIds
        },
        { timeout: AI_TIMEOUT }
    );
    return data;
};

/**
 * [Phase 2] Asset Management API - 1. 파일 업로드
 * 파일을 서버에 업로드하고 즉시 생성된 Asset ID를 반환받습니다. (분석은 비동기로 진행)
 */
export const uploadAssetFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // axios에서 multipart/form-data는 자동으로 처리되도록 헤더 설정
    const { data } = await client.post<{ assetId: string; status: string }>(
        '/assets',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' }
        }
    );
    return data;
};

/**
 * [Phase 2] Asset Management API - 2. 상태 폴링
 * 특정 자산의 분석 상태(UPLOADING, ANALYZING, READY, FAILED) 및 설명 정보를 조회합니다.
 */
export const getAssetStatus = async (assetId: string) => {
    // [Updated] 백엔드 응답 구조 반영 (summary -> description)
    const { data } = await client.get<{
        id: string;
        status: 'UPLOADING' | 'ANALYZING' | 'READY' | 'FAILED';
        description?: string;
    }>(`/assets/${assetId}`);
    return data;
};

/**
 * [Phase 2] Asset Management API - 3. 상세 내용 조회
 * 분석이 완료된 자산의 전체 텍스트 내용을 조회합니다.
 */
export const getAssetContent = async (assetId: string) => {
    const { data } = await client.get<{ content: string }>(`/assets/${assetId}/content`);
    return data;
};

/**
 * ---------------------------------------------------------
 * 기존 워크플로우 관련 API (호환성 유지)
 * ---------------------------------------------------------
 */

/**
 * 1. 프로세스 생성 요청 (Quick Start)
 */
export const startProcessGeneration = async (prompt: string) => {
    const { data } = await client.post<{ jobId: string; message: string }>(
        '/copilot/start',
        { userPrompt: prompt }
    );
    return data;
};

/**
 * 2. 프로세스 변환 요청 (Mode B: Outliner -> Map)
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
 */
export const getJobStatus = async (jobId: string) => {
    const { data } = await client.get<JobStatus>(`/copilot/status/${jobId}`);
    return data;
};

/**
 * 4. 다음 단계 제안 (Canvas Contextual AI)
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
    }, { timeout: AI_TIMEOUT });
    return data;
};

/**
 * 5. 프로세스 분석 (Shadow Architect)
 */
export const analyzeProcess = async (graphSnapshot: any) => {
    const { data } = await client.post<AnalysisResult[]>('/copilot/analyze', graphSnapshot, {
        timeout: AI_TIMEOUT
    });
    return data;
};

/**
 * 6. 에러 수정 요청 (Surgical Fix)
 */
export const fixProcessGraph = async (graphSnapshot: any, error: AnalysisResult) => {
    const { data } = await client.post<{ nodes: any[], edges: any[], fixDescription?: string }>(
        '/copilot/analyze/fix',
        { graphSnapshot, error },
        { timeout: AI_TIMEOUT }
    );
    return data;
};

/**
 * 7. 이미지 기반 프로세스 직접 분석
 */
export const analyzeAsset = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.post<ProcessDefinition>('/copilot/analyze/asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: AI_TIMEOUT
    });
    return data;
};

/**
 * 8. 데이터/폼 자동 발견 제안 (Auto-Discovery)
 */
export const suggestAutoDiscovery = async (processContext: any, existingEntities: any[]) => {
    const { data } = await client.post<DataEntitiesResponse>(
        '/suggest/data-model/auto-discovery',
        { processContext, existingEntities },
        { timeout: AI_TIMEOUT }
    );
    return data;
};

export const suggestFormAutoDiscovery = async (processContext: any, existingEntities: any[], existingForms: any[]) => {
    const { data } = await client.post<FormResponse>(
        '/suggest/form/auto-discovery',
        { processContext, existingEntities, existingForms },
        { timeout: AI_TIMEOUT }
    );
    return data;
};