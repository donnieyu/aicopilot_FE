import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ProcessResponse, ProcessStep } from '../../../../types/workflow';
import { suggestProcessOutline, suggestStepDetail } from '../../../../api/workflow';

export function useOutliner(process: ProcessResponse | null, initialTopic: string) {
    const [topic, setTopic] = useState(process?.processName || initialTopic);
    const [description, setDescription] = useState(process?.description || '');

    // Lazy initialization for steps
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

    // Sync Effect
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

    // [Updated] Step Detail AI Mutation with FULL Context
    const { mutate: getStepDetail, isPending: isStepSuggesting } = useMutation({
        mutationFn: (params: { topic: string, context: string, stepIndex: number, currentSteps: { name: string, role: string }[] }) =>
            suggestStepDetail(params.topic, params.context, params.stepIndex, params.currentSteps),
        onSuccess: (data) => {
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
            alert("Failed to get suggestion. Please try again.");
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

    // [Updated] Auto-fill handler logic: Send ALL steps
    const autoFillStep = (index: number) => {
        if (!topic) {
            alert("Please enter a topic first.");
            return;
        }

        // Prepare context: Exclude the current editing step (which is empty/incomplete)
        // or send it as a placeholder. Better to send surrounding steps.
        // Strategy: Send the list as it is in 'draftSteps'. The item at 'index' is the one we are editing.
        // AI needs to know what is at 0...index-1 and index+1...end.

        const allStepsData = draftSteps.map(step => ({
            name: step.name || "(New Step)", // Mark empty steps clearly
            role: step.role || "Unknown"
        }));

        getStepDetail({
            topic,
            context: description,
            stepIndex: index,
            currentSteps: allStepsData // [Updated]
        });
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
        isStepSuggesting,
        editingStepId,
        tempStep,
        generateWithAI,
        autoFillStep,
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