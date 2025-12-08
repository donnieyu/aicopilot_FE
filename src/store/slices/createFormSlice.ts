import type { StateCreator } from 'zustand';
import type { WorkflowState } from '../useWorkflowStore';
import type { FormDefinitions } from '../../types/workflow';

export interface FormSlice {
    formDefinitions: FormDefinitions[];

    setFormDefinitions: (forms: FormDefinitions[]) => void;
    addFormDefinition: (form: FormDefinitions) => void;
    resetForms: () => void;
}

export const createFormSlice: StateCreator<WorkflowState, [], [], FormSlice> = (set) => ({
    formDefinitions: [],

    setFormDefinitions: (forms) => set({ formDefinitions: forms }),
    addFormDefinition: (form) => set((state) => ({ formDefinitions: [...state.formDefinitions, form] })),
    resetForms: () => set({ formDefinitions: [] }),
});