import { create } from 'zustand';
import { createGraphSlice } from './slices/createGraphSlice';
import type { GraphSlice } from './slices/createGraphSlice';
import { createDataSlice } from './slices/createDataSlice';
import type { DataSlice } from './slices/createDataSlice';
import { createFormSlice } from './slices/createFormSlice';
import type { FormSlice } from './slices/createFormSlice';
import { createUiSlice } from './slices/createUiSlice';
import type { UiSlice } from './slices/createUiSlice';
import { createAnalysisSlice } from './slices/createAnalysisSlice';
import type { AnalysisSlice } from './slices/createAnalysisSlice';

// Combine all slice interfaces
export type WorkflowState = GraphSlice & DataSlice & FormSlice & UiSlice & AnalysisSlice & {
    reset: () => void;
};

export const useWorkflowStore = create<WorkflowState>((...a) => ({
    ...createGraphSlice(...a),
    ...createDataSlice(...a),
    ...createFormSlice(...a),
    ...createUiSlice(...a),
    ...createAnalysisSlice(...a),

    // Unified Reset Action
    reset: () => {
        // [Fix] Removed unused 'set' by using destructuring skip
        const [, get] = a;
        get().resetGraph();
        get().resetData();
        get().resetForms();
        get().resetUi();
        get().resetAnalysis();
    }
}));