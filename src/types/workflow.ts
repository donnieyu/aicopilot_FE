/**
 * Java Enum: NodeType
 */
export type NodeType = 'USER_TASK' | 'SERVICE_TASK' | 'EXCLUSIVE_GATEWAY';

/**
 * Java Record: NodeConfiguration
 */
export interface NodeConfiguration {
    configType: 'USER_TASK_CONFIG' | 'EMAIL_CONFIG' | 'GATEWAY_CONFIG';

    // User Task Fields
    participantRole?: string;
    formKey?: string;
    isApproval?: boolean;
    dueDuration?: string;

    // Service Task Fields
    templateId?: string;
    subject?: string;
    retryCount?: number;
    priority?: string;

    // Gateway Fields
    defaultNextActivityId?: string;
    conditions?: BranchCondition[];
}

export interface BranchCondition {
    expression: string;
    targetActivityId: string;
}

/**
 * Java Record: Activity (Node)
 */
export interface Activity {
    id: string;
    type: NodeType;
    label: string;
    swimlaneId?: string;
    description?: string;
    configuration: NodeConfiguration;
    inputMapping?: Record<string, string>;
    position?: { x: number; y: number };
    nextActivityId?: string;
    layoutDirection?: 'LR' | 'TB';
}

/**
 * Java Record: Swimlane
 */
export interface Swimlane {
    swimlaneId: string;
    name: string;
    nextSwimlaneId?: string;
}

/**
 * Java Record: ProcessResponse (The Artifact)
 */
export interface ProcessResponse {
    processName: string;
    description: string;
    swimlanes: Swimlane[];
    activities: Activity[];
}

// ----------------------------------------------------------------------
// [NEW] Process Definition Types (Mode B: Outliner)
// ----------------------------------------------------------------------

export interface ProcessStep {
    stepId: string;
    name: string;
    role: string;
    description: string;
    type: 'ACTION' | 'DECISION';
}

export interface ProcessDefinition {
    topic: string;
    steps: ProcessStep[];
}

// ----------------------------------------------------------------------
// [NEW] Data Entity Types (Replaces 'any' for dataEntitiesResponse)
// ----------------------------------------------------------------------

export type DataEntityType =
    | 'string' | 'integer' | 'number' | 'boolean'
    | 'date' | 'datetime' | 'time'
    | 'utc_date' | 'utc_datetime' | 'utc_time'
    | 'file' | 'lookup' | 'sign' | 'tristate'
    | 'string_array' | 'integer_array' | 'number_array'
    | 'date_array' | 'utc_date_array' | 'lookup_array';

export interface LookupItem {
    value: string;
    label: string;
}

export interface LookupData {
    name: string;
    description?: string;
    lookupItems: LookupItem[];
}

export interface DataEntity {
    id: string;
    alias: string;
    sourceNodeId?: string;
    label: string;
    type: DataEntityType;
    description?: string;
    required?: boolean;
    isPrimaryKey?: boolean;
    maxLength?: number;
    lookupData?: LookupData;
    pattern?: string;
    requireTrue?: boolean;
}

export interface DataEntitiesGroup {
    id: string;
    alias: string;
    name: string;
    description?: string;
    entityIds: string[];
}

export interface DataEntitiesResponse {
    entities: DataEntity[];
    groups: DataEntitiesGroup[];
}

// ----------------------------------------------------------------------
// [NEW] Form UX Types (Replaces 'any' for formResponse)
// ----------------------------------------------------------------------

export type FormFieldComponent =
    | 'input_text' | 'input_textarea' | 'input_number'
    | 'checkbox' | 'chips'
    | 'dropdown' | 'multiple_dropdown'
    | 'date_picker' | 'multiple_date_picker'
    | 'date_time_picker' | 'time_picker'
    | 'file_upload' | 'file_list'
    | 'signature' | 'tri_state_checkbox';

export interface FormField {
    id: string;
    entityAlias: string; // Must match DataEntity.alias
    label: string;
    component: FormFieldComponent;
    required: boolean;
    visibleActivityIds?: string[];
    readonlyActivityIds?: string[];
}

export interface FormFieldGroup {
    id: string;
    name: string;
    description?: string;
    visibleActivityIds?: string[];
    fields: FormField[];
}

export interface FormDefinitions {
    formName: string;
    formDescription?: string;
    fieldGroups: FormFieldGroup[];
}

export interface FormResponse {
    formDefinitions: FormDefinitions[];
}

// ----------------------------------------------------------------------
// Job Status
// ----------------------------------------------------------------------

/**
 * Java Record: JobStatus (Polling Response)
 */
export interface JobStatus {
    jobId: string;
    state: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    message: string;
    lastUpdatedStage: string;
    version: number;
    startTime: number;
    totalElapsedMillis: number;

    // 단계별 소요 시간
    stageDurations?: Record<string, number>;

    // 결과물 (완전한 타입 정의 적용됨)
    processResponse?: ProcessResponse;
    dataEntitiesResponse?: DataEntitiesResponse;
    formResponse?: FormResponse;
}

/**
 * Java Record: NodeSuggestion (AI Recommendation)
 */
export interface NodeSuggestion {
    title: string;
    reason: string;
    type: NodeType;
    configuration: NodeConfiguration;
    inputMapping?: Record<string, string>;
}

export interface SuggestionResponse {
    suggestions: NodeSuggestion[];
}

// ----------------------------------------------------------------------
// [NEW] Analysis Result Type (Shadow Architect)
// ----------------------------------------------------------------------
export interface AnalysisResult {
    targetNodeId: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    type: string;
    message: string;
    suggestion?: string;
}