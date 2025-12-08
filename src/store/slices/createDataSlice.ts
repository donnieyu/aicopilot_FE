import type { StateCreator } from 'zustand';
import type { WorkflowState } from '../useWorkflowStore';
import type { DataEntity, DataEntitiesGroup } from '../../types/workflow';
import { getUpstreamNodeIds } from '../../utils/graphUtils';

export interface DataSlice {
    dataEntities: DataEntity[];
    dataGroups: DataEntitiesGroup[];

    setDataModel: (entities: DataEntity[], groups: DataEntitiesGroup[]) => void;
    addDataEntity: (entity: DataEntity) => void;
    getAvailableVariables: (nodeId: string) => DataEntity[];
    resetData: () => void;
}

export const createDataSlice: StateCreator<WorkflowState, [], [], DataSlice> = (set, get) => ({
    dataEntities: [],
    dataGroups: [],

    setDataModel: (entities, groups) => set({ dataEntities: entities, dataGroups: groups }),

    addDataEntity: (entity) => {
        const { dataEntities, dataGroups } = get();
        if (dataEntities.some(e => e.id === entity.id || e.alias === entity.alias)) return;

        const newEntities = [...dataEntities, entity];
        const targetGroupIndex = dataGroups.findIndex(g => g.id === 'group_user_defined');
        const newGroups = [...dataGroups];

        if (targetGroupIndex === -1) {
            const newGroup: DataEntitiesGroup = {
                id: 'group_user_defined',
                alias: 'UserDefined',
                name: 'User Defined Variables',
                description: 'Manually created variables.',
                entityIds: [entity.id]
            };
            newGroups.push(newGroup);
        } else {
            const targetGroup = { ...newGroups[targetGroupIndex] };
            targetGroup.entityIds = [...targetGroup.entityIds, entity.id];
            newGroups[targetGroupIndex] = targetGroup;
        }

        set({ dataEntities: newEntities, dataGroups: newGroups });
    },

    getAvailableVariables: (nodeId) => {
        const { edges } = get();
        const { dataEntities } = get();

        const upstreamNodeIds = getUpstreamNodeIds(nodeId, edges);
        return dataEntities.filter(entity =>
            entity.sourceNodeId && upstreamNodeIds.has(entity.sourceNodeId)
        );
    },

    resetData: () => set({ dataEntities: [], dataGroups: [] }),
});