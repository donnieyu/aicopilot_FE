import { create } from 'zustand';

/**
 * 업로드된 파일(Asset) 및 분석 상태를 관리하는 스토어
 */

export type AssetStatus = 'UPLOADING' | 'ANALYZING' | 'READY' | 'FAILED';

export interface Asset {
    id: string;
    name: string;
    type: string;
    size: number;
    status: AssetStatus;
    // [Updated] 백엔드 DTO와 일치 (summary -> description)
    description?: string;
    content?: string;
    uploadTime: number;
}

interface AssetState {
    assets: Asset[];
    isUploading: boolean;

    // Actions
    addAsset: (asset: Asset) => void;
    updateAssetStatus: (id: string, status: AssetStatus, data?: Partial<Asset>) => void;
    removeAsset: (id: string) => void;
    setAssets: (assets: Asset[]) => void;
}

export const useAssetStore = create<AssetState>((set) => ({
    assets: [],
    isUploading: false,

    addAsset: (asset) => set((state) => ({
        assets: [asset, ...state.assets]
    })),

    updateAssetStatus: (id, status, data) => set((state) => ({
        assets: state.assets.map((a) =>
            a.id === id ? { ...a, status, ...data } : a
        )
    })),

    removeAsset: (id) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== id)
    })),

    setAssets: (assets) => set({ assets }),
}));