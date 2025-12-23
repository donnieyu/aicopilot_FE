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

// =====================================================================
// [Phase 2] Copilot Chat & Knowledge API
// =====================================================================

/**
 * Chat with Context API
 * 사용자 메시지와 선택된 지식(Asset) ID 목록을 전달하여 대화를 진행하거나 프로세스를 생성합니다.
 */
export const chatWithAi = async (userPrompt: string, selectedAssetIds: string[]) => {
    // BE: CopilotController.chatWithAi -> POST /api/copilot/chat
    const { data } = await client.post<{
        reply: string;
        jobId?: string; // 프로세스 생성이 트리거된 경우 존재
    }>(
        '/copilot/chat',
        {
            userPrompt, // ChatRequest DTO 필드명 확인 (message vs userPrompt)
            selectedAssetIds
        },
        { timeout: AI_TIMEOUT }
    );
    return data;
};

/**
 * Asset Upload API
 * 파일을 업로드하고 즉시 Asset ID를 반환받습니다. (분석은 비동기)
 */
export const uploadAssetFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // BE: AssetController.uploadAsset -> POST /api/assets
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
 * Asset Status Polling API
 * 특정 자산의 분석 상태 및 설명(요약)을 조회합니다.
 */
export const getAssetStatus = async (assetId: string) => {
    // BE: AssetController.getAssetStatusOnly -> GET /api/assets/{id}/status
    const { data } = await client.get<{
        id: string;
        status: 'UPLOADING' | 'ANALYZING' | 'READY' | 'FAILED';
        description?: string;
    }>(`/assets/${assetId}/status`);
    return data;
};


// =====================================================================
// Legacy / Core Workflow API
// =====================================================================

/**
 * 1. 프로세스 생성 요청 (Quick Start - Legacy)
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fixProcessGraph = async (graphSnapshot: any, error: AnalysisResult) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await client.post<{ nodes: any[], edges: any[], fixDescription?: string }>(
        '/copilot/analyze/fix',
        { graphSnapshot, error },
        { timeout: AI_TIMEOUT }
    );
    return data;
};

/**
 * 7. 이미지 기반 프로세스 직접 분석 (Legacy Direct API)
 * [Note] 이제는 Chat Context Flow가 권장되지만, Landing Page의 'Start from Asset' 기능을 위해 유지
 */
export const analyzeAsset = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // BE: CopilotController.analyzeAsset -> POST /api/copilot/analyze/asset
    const { data } = await client.post<ProcessDefinition>('/copilot/analyze/asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: AI_TIMEOUT
    });
    return data;
};

/**
 * 8. 데이터/폼 자동 발견 제안 (Auto-Discovery)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suggestAutoDiscovery = async (processContext: any, existingEntities: any[]) => {
    const { data } = await client.post<DataEntitiesResponse>(
        '/copilot/suggest/data-model/auto-discovery',
        { processContext, existingEntities },
        { timeout: AI_TIMEOUT }
    );
    return data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suggestFormAutoDiscovery = async (processContext: any, existingEntities: any[], existingForms: any[]) => {
    const { data } = await client.post<FormResponse>(
        '/copilot/suggest/form/auto-discovery',
        { processContext, existingEntities, existingForms },
        { timeout: AI_TIMEOUT }
    );
    return data;
};