import type { StateCreator } from 'zustand';
import type { WorkflowState } from '../useWorkflowStore';
import type { AnalysisResult } from '../../types/workflow';

export interface AnalysisSlice {
    analysisResults: Record<string, AnalysisResult[]>;

    setAnalysisResults: (results: AnalysisResult[]) => void;
    clearAnalysisResults: () => void;
    resetAnalysis: () => void;
}

export const createAnalysisSlice: StateCreator<WorkflowState, [], [], AnalysisSlice> = (set) => ({
    analysisResults: {},

    setAnalysisResults: (results) => {
        const grouped: Record<string, AnalysisResult[]> = {};
        results.forEach(item => {
            const key = item.targetNodeId || 'global';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });
        set({ analysisResults: grouped });
    },

    clearAnalysisResults: () => set({ analysisResults: {} }),
    resetAnalysis: () => set({ analysisResults: {} }),
});