import { useRef } from 'react';
import { UploadCloud, FileText, CheckSquare, Square, Trash2, Loader2, Info } from 'lucide-react';
import clsx from 'clsx';
import { useAssetStore, type Asset } from '../../../../store/useAssetStore';
import { useCopilotStore } from '../../../../store/useCopilotStore'; // 상대경로 수정됨
import { uploadAssetFile, getAssetStatus } from '../../../../api/workflow';

/**
 * 지식 자산(Asset) 매니저
 * 업로드된 파일을 관리하고, AI가 참고할 지식 컨텍스트를 선택합니다.
 */

export function AssetManager() {
    const { assets, isUploading, addAsset, removeAsset, updateAssetStatus } = useAssetStore();
    const { selectedAssetIds, toggleAssetSelection } = useCopilotStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 분석 상태를 폴링하는 내부 함수
    const startPolling = (assetId: string) => {
        const interval = setInterval(async () => {
            try {
                const data = await getAssetStatus(assetId);

                if (data.status === 'READY') {
                    // [Updated] summary -> description으로 변경
                    updateAssetStatus(assetId, 'READY', { description: data.description });
                    toggleAssetSelection(assetId); // 준비 완료 시 자동 선택
                    clearInterval(interval);
                } else if (data.status === 'FAILED') {
                    updateAssetStatus(assetId, 'FAILED');
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Asset polling error:', error);
                clearInterval(interval);
            }
        }, 3000);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            try {
                // 1. API 호출: 파일 업로드 및 ID 획득
                const { assetId } = await uploadAssetFile(file);

                // 2. Store에 업로드 중 상태로 추가
                const newAsset: Asset = {
                    id: assetId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    status: 'ANALYZING',
                    uploadTime: Date.now()
                };
                addAsset(newAsset);

                // 3. 상태 폴링 시작
                startPolling(assetId);

            } catch (error) {
                alert('파일 업로드에 실패했습니다.');
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white">
                <label
                    className={clsx(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-2 bg-indigo-50 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            {isUploading ? <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /> : <UploadCloud className="w-6 h-6 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-slate-600 font-bold">참조 지식 추가</p>
                        <p className="text-[10px] text-slate-400 mt-1">사내 규정, 매뉴얼 (PDF, Excel, 이미지)</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {assets.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">등록된 지식이 없습니다.</p>
                    </div>
                ) : (
                    assets.map((asset) => (
                        <AssetItem
                            key={asset.id}
                            asset={asset}
                            isSelected={selectedAssetIds.includes(asset.id)}
                            onToggle={() => toggleAssetSelection(asset.id)}
                            onRemove={() => removeAsset(asset.id)}
                        />
                    ))
                )}
            </div>

            <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-[10px] text-indigo-700 flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p>체크된 자산은 AI가 답변을 하거나 프로세스를 생성할 때 <b>전문 지식 컨텍스트</b>로 활용됩니다.</p>
            </div>
        </div>
    );
}

function AssetItem({ asset, isSelected, onToggle, onRemove }: { asset: Asset, isSelected: boolean, onToggle: () => void, onRemove: () => void }) {
    const isReady = asset.status === 'READY';
    const isAnalyzing = asset.status === 'ANALYZING' || asset.status === 'UPLOADING';

    return (
        <div className={clsx(
            "group bg-white rounded-lg border p-3 transition-all relative hover:shadow-sm",
            isSelected ? "border-indigo-500 ring-1 ring-indigo-500 shadow-sm" : "border-slate-200"
        )}>
            <div className="flex items-start gap-3">
                {/* 선택 체크박스 */}
                <button
                    onClick={isReady ? onToggle : undefined}
                    disabled={!isReady}
                    className={clsx(
                        "mt-0.5 transition-colors",
                        !isReady ? "cursor-wait opacity-50" : "cursor-pointer hover:text-indigo-600",
                        isSelected ? "text-indigo-600" : "text-slate-300"
                    )}
                >
                    {isAnalyzing ? (
                        <Loader2 size={18} className="animate-spin text-indigo-400" />
                    ) : isSelected ? (
                        <CheckSquare size={18} />
                    ) : (
                        <Square size={18} />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate pr-6" title={asset.name}>{asset.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {asset.type.split('/')[1] || 'FILE'}
                        </span>
                        <span className="text-[9px] text-slate-400">{(asset.size / 1024).toFixed(1)} KB</span>
                    </div>

                    {/* [Updated] description 필드 렌더링 */}
                    {asset.description && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                            <span className="font-bold text-indigo-500 mr-1 italic">AI Insight:</span>
                            {asset.description}
                        </div>
                    )}
                </div>

                {/* 삭제 버튼 */}
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 rounded p-1 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}