import { useRef } from 'react';
import { UploadCloud, FileText, CheckSquare, Square, Trash2, File, Loader2, Info } from 'lucide-react';
import clsx from 'clsx';
import { useAssetStore, type Asset } from '../../../../store/useAssetStore';

export function AssetManager() {
    const { assets, selectedAssetIds, isUploading, uploadAsset, removeAsset, toggleAssetSelection } = useAssetStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadAsset(e.target.files[0]);
        }
        // Reset input for same file upload
        if (fileInputRef.current) fileInputRef.current.value = '';
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
                        <p className="text-xs text-slate-600 font-bold">Click to upload knowledge</p>
                        <p className="text-[10px] text-slate-400 mt-1">PDF, Excel, Images (Max 10MB)</p>
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
                        <p className="text-xs text-slate-400">No knowledge assets yet.</p>
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

            {/* Info Footer */}
            <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-[10px] text-indigo-700 flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p>Checked assets are used as <b>Context Knowledge</b> for AI generation. Uncheck to exclude them from the prompt.</p>
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
            isSelected ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200"
        )}>
            <div className="flex items-start gap-3">
                {/* Checkbox / Status Icon */}
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
                    <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-700 truncate pr-6" title={asset.name}>{asset.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{asset.type.split('/')[1] || 'FILE'}</span>
                        <span className="text-[10px] text-slate-400">{(asset.size / 1024).toFixed(1)} KB</span>
                    </div>

                    {/* Analysis Preview (Simple Text) */}
                    {asset.content && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                            <span className="font-bold text-indigo-500 mr-1">AI Insight:</span>
                            {asset.content.substring(0, 80)}...
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded p-1 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}