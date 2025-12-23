import { useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckSquare, Square, Trash2, Loader2, Info } from 'lucide-react';
import clsx from 'clsx';
// Relative paths strictly maintained
import { useAssetStore, type Asset } from '../../../../store/useAssetStore';
import { useChatStore } from '../../../../store/useChatStore';
import { uploadAssetFile, getAssetStatus } from '../../../../api/workflow';

/**
 * Knowledge Asset Manager
 * Manages uploaded files and selects knowledge context for the AI.
 * All UI labels and messages are converted to English.
 */
export function AssetManager() {
    const { assets, isUploading, addAsset, removeAsset, updateAssetStatus } = useAssetStore();
    const { selectedAssetIds, toggleAssetSelection, setSelectedAssets } = useChatStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});

    useEffect(() => {
        return () => {
            Object.values(pollingIntervals.current).forEach(clearInterval);
        };
    }, []);

    const startPolling = (assetId: string) => {
        if (pollingIntervals.current[assetId]) return;

        const interval = setInterval(async () => {
            try {
                const data = await getAssetStatus(assetId);

                if (data.status === 'READY') {
                    updateAssetStatus(assetId, 'READY', { description: data.description });

                    const currentSelected = useChatStore.getState().selectedAssetIds;
                    if (!currentSelected.includes(assetId)) {
                        setSelectedAssets([...currentSelected, assetId]);
                    }

                    clearInterval(interval);
                    delete pollingIntervals.current[assetId];
                } else if (data.status === 'FAILED') {
                    updateAssetStatus(assetId, 'FAILED', { description: 'Analysis failed.' });
                    clearInterval(interval);
                    delete pollingIntervals.current[assetId];
                }
            } catch (error) {
                console.error('Asset polling error:', error);
            }
        }, 2000);

        pollingIntervals.current[assetId] = interval;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            try {
                const { assetId, status } = await uploadAssetFile(file);

                const newAsset: Asset = {
                    id: assetId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    status: status as any,
                    uploadTime: Date.now()
                };
                addAsset(newAsset);

                if (status !== 'READY' && status !== 'FAILED') {
                    startPolling(assetId);
                } else if (status === 'READY') {
                    toggleAssetSelection(assetId);
                }

            } catch (error) {
                console.error("Upload failed", error);
                alert('Failed to upload the file. Please try again.');
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemove = (id: string) => {
        removeAsset(id);
        const newSelected = selectedAssetIds.filter(assetId => assetId !== id);
        setSelectedAssets(newSelected);

        if (pollingIntervals.current[id]) {
            clearInterval(pollingIntervals.current[id]);
            delete pollingIntervals.current[id];
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Upload Area */}
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
                        <p className="text-xs text-slate-600 font-bold">Add Reference Knowledge</p>
                        <p className="text-[10px] text-slate-400 mt-1">Manuals, Regulations (PDF, Excel, Images)</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt,.md"
                    />
                </label>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {assets.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">No knowledge assets registered yet.</p>
                    </div>
                ) : (
                    assets.map((asset) => (
                        <AssetItem
                            key={asset.id}
                            asset={asset}
                            isSelected={selectedAssetIds.includes(asset.id)}
                            onToggle={() => toggleAssetSelection(asset.id)}
                            onRemove={() => handleRemove(asset.id)}
                        />
                    ))
                )}
            </div>

            {/* Info Footer */}
            <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-[10px] text-indigo-700 flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p>Selected assets will be used as <b>Expert Knowledge Context</b> for AI-generated designs and responses.</p>
            </div>
        </div>
    );
}

function AssetItem({ asset, isSelected, onToggle, onRemove }: { asset: Asset, isSelected: boolean, onToggle: () => void, onRemove: () => void }) {
    const isReady = asset.status === 'READY';
    const isAnalyzing = asset.status === 'ANALYZING' || asset.status === 'UPLOADING';
    const isFailed = asset.status === 'FAILED';

    return (
        <div className={clsx(
            "group bg-white rounded-lg border p-3 transition-all relative hover:shadow-sm",
            isSelected ? "border-indigo-500 ring-1 ring-indigo-500 shadow-sm" : "border-slate-200",
            isFailed && "border-red-200 bg-red-50/30"
        )}>
            <div className="flex items-start gap-3">
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
                    <h4 className={clsx("text-xs font-bold truncate pr-6", isFailed ? "text-red-600" : "text-slate-700")} title={asset.name}>{asset.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {asset.type.split('/')[1] || 'FILE'}
                        </span>
                        <span className="text-[9px] text-slate-400">{(asset.size / 1024).toFixed(1)} KB</span>
                    </div>

                    {asset.description && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-[10px] text-slate-500 leading-relaxed border border-slate-100 animate-in fade-in">
                            <span className="font-bold text-indigo-500 mr-1 italic">AI Insight:</span>
                            {asset.description}
                        </div>
                    )}
                </div>

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