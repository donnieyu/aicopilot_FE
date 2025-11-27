import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ProcessResponse, ProcessStep } from '../../../../types/workflow';
import { suggestProcessOutline, suggestStepDetail } from '../../../../api/workflow'; // [Fix] Import added

export function useOutliner(process: ProcessResponse | null, initialTopic: string) {
    const [topic, setTopic] = useState(process?.processName || initialTopic);
    const [description, setDescription] = useState(process?.description || '');

    const [draftSteps, setDraftSteps] = useState<ProcessStep[]>(() => {
        if (process) {
            return process.activities.map((act) => ({
                stepId: act.id,
                name: act.label,
                role: act.configuration?.participantRole || 'System',
                description: act.description || '',
                type: act.type === 'EXCLUSIVE_GATEWAY' ? 'DECISION' : 'ACTION'
            }));
        }
        return [];
    });

    const [editingStepId, setEditingStepId] = useState<string | null>(null);
    const [tempStep, setTempStep] = useState<Partial<ProcessStep>>({});

    useEffect(() => {
        if (process) {
            setTopic(prev => (prev !== process.processName ? process.processName : prev));
            setDescription(prev => (prev !== process.description ? process.description : prev));

            const steps: ProcessStep[] = process.activities.map((act) => ({
                stepId: act.id,
                name: act.label,
                role: act.configuration?.participantRole || 'System',
                description: act.description || '',
                type: act.type === 'EXCLUSIVE_GATEWAY' ? 'DECISION' : 'ACTION'
            }));
            setDraftSteps(steps);
        }
    }, [process]);

    // Outline AI Mutation
    const { mutate: getOutline, isPending: isSuggesting } = useMutation({
        mutationFn: (params: { currentTopic: string, currentDesc: string }) =>
            suggestProcessOutline(params.currentTopic, params.currentDesc),
        onSuccess: (data) => {
            setDraftSteps(data.steps);
        }
    });

    // [New] Step Detail AI Mutation
    const { mutate: getStepDetail, isPending: isStepSuggesting } = useMutation({
        mutationFn: (params: { topic: string, context: string, stepIndex: number }) =>
            suggestStepDetail(params.topic, params.context, params.stepIndex),
        onSuccess: (data) => {
            // Merge suggested data into tempStep (keep existing ID)
            setTempStep(prev => ({
                ...prev,
                name: data.name,
                role: data.role,
                description: data.description,
                type: data.type
            }));
        },
        onError: (error) => {
            console.error("Failed to suggest step:", error);
            // Fallback or Toast here
        }
    });

    const generateWithAI = () => {
        if (!topic || !description) return;
        if (draftSteps.length > 0) {
            const isConfirmed = window.confirm(
                "There are existing steps. Generating a new draft will overwrite them.\nDo you want to continue?"
            );
            if (!isConfirmed) return;
        }
        getOutline({ currentTopic: topic, currentDesc: description });
    };

    // [New] Auto-fill handler for StepEditor
    const autoFillStep = (index: number) => {
        if (!topic) {
            alert("Please enter a topic first.");
            return;
        }
        // Send context including topic, description, and maybe previous step info
        getStepDetail({ topic, context: description, stepIndex: index });
    };

    const addStep = (index: number) => {
        const newStep: ProcessStep = {
            stepId: `temp_${Date.now()}`,
            name: '',
            role: 'User',
            description: '',
            type: 'ACTION'
        };
        const newSteps = [...draftSteps];
        newSteps.splice(index, 0, newStep);
        setDraftSteps(newSteps);
        setEditingStepId(newStep.stepId);
        setTempStep(newStep);
    };

    const deleteStep = (id: string) => {
        setDraftSteps(draftSteps.filter(s => s.stepId !== id));
    };

    const saveStep = () => {
        if (editingStepId && tempStep) {
            setDraftSteps(draftSteps.map(s => s.stepId === editingStepId ? { ...s, ...tempStep } as ProcessStep : s));
            setEditingStepId(null);
            setTempStep({});
        }
    };

    const cancelStep = () => {
        if (editingStepId) {
            const originalStep = draftSteps.find(s => s.stepId === editingStepId);
            if (originalStep && !originalStep.name.trim()) {
                setDraftSteps(prev => prev.filter(s => s.stepId !== editingStepId));
            }
        }
        setEditingStepId(null);
        setTempStep({});
    };

    const updateTempStep = (field: keyof ProcessStep, value: ProcessStep[keyof ProcessStep]) => {
        setTempStep(prev => ({ ...prev, [field]: value }));
    };

    return {
        topic, setTopic,
        description, setDescription,
        draftSteps,
        isSuggesting,
        isStepSuggesting, // [New] Expose loading state
        editingStepId,
        tempStep,
        generateWithAI,
        autoFillStep, // [New] Expose handler
        addStep,
        deleteStep,
        saveStep,
        cancelStep,
        startEditing: (id: string, step: ProcessStep) => {
            setEditingStepId(id);
            setTempStep(step);
        },
        updateTempStep
    };
}