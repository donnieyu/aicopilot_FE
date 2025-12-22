import { create } from 'zustand';

export type AssetStatus = 'UPLOADING' | 'ANALYZING' | 'READY' | 'FAILED';

export interface Asset {
    id: string;
    name: string;
    type: string; // MIME type
    size: number;
    status: AssetStatus;
    content?: string; // 분석된 텍스트 결과 (요약)
    uploadTime: number;
}

interface AssetState {
    assets: Asset[];
    selectedAssetIds: string[]; // 체크박스로 선택된 에셋 ID들
    isUploading: boolean;

    // Actions
    uploadAsset: (file: File) => Promise<void>;
    removeAsset: (id: string) => void;
    toggleAssetSelection: (id: string) => void;
    selectAllAssets: (selected: boolean) => void;
}

export const useAssetStore = create<AssetState>((set, get) => ({
    assets: [],
    selectedAssetIds: [],
    isUploading: false,

    uploadAsset: async (file: File) => {
        set({ isUploading: true });

        // 1. 임시 에셋 생성 (Optimistic UI)
        const tempId = `asset_${Date.now()}`;
        const newAsset: Asset = {
            id: tempId,
            name: file.name,
            type: file.type,
            size: file.size,
            status: 'UPLOADING',
            uploadTime: Date.now()
        };

        set((state) => ({ assets: [...state.assets, newAsset] }));

        // 2. 비동기 업로드 및 분석 시뮬레이션 (Mock)
        // TODO: 실제 백엔드 API (POST /api/assets) 연동 시 교체 필요
        try {
            // Uploading...
            await new Promise(resolve => setTimeout(resolve, 1000));
            set((state) => ({
                assets: state.assets.map(a => a.id === tempId ? { ...a, status: 'ANALYZING' } : a)
            }));

            // Analyzing...
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockAnalysisResult = `[AI Analysis] This document (${file.name}) contains business rules regarding approval thresholds and department roles.`;

            set((state) => ({
                assets: state.assets.map(a => a.id === tempId ? { ...a, status: 'READY', content: mockAnalysisResult } : a),
                // 분석 완료 시 자동으로 선택 상태로 추가할지 여부는 UX 결정 사항 (여기선 자동 선택)
                selectedAssetIds: [...state.selectedAssetIds, tempId]
            }));

        } catch (error) {
            set((state) => ({
                assets: state.assets.map(a => a.id === tempId ? { ...a, status: 'FAILED' } : a)
            }));
        } finally {
            set({ isUploading: false });
        }
    },

    removeAsset: (id) => set((state) => ({
        assets: state.assets.filter(a => a.id !== id),
        selectedAssetIds: state.selectedAssetIds.filter(selectedId => selectedId !== id)
    })),

    toggleAssetSelection: (id) => set((state) => {
        const isSelected = state.selectedAssetIds.includes(id);
        return {
            selectedAssetIds: isSelected
                ? state.selectedAssetIds.filter(item => item !== id)
                : [...state.selectedAssetIds, id]
        };
    }),

    selectAllAssets: (selected) => set((state) => ({
        selectedAssetIds: selected
            ? state.assets.filter(a => a.status === 'READY').map(a => a.id)
            : []
    }))
}));