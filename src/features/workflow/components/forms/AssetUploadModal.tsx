import { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, FileImage, FileText, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { AiActionButton } from '../../../../components/AiActionButton';
import { analyzeAsset } from '../../../../api/workflow'; // [New] Import
import type { ProcessDefinition } from '../../../../types/workflow'; // [New] Import

interface AssetUploadModalProps {
    onClose: () => void;
    // [Updated] 콜백 시그니처 변경: topic/desc 문자열 대신 완전한 정의 객체 전달
    onAnalyzeComplete: (definition: ProcessDefinition) => void;
}

export function AssetUploadModal({ onClose, onAnalyzeComplete }: AssetUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // [Updated] Real API Call using analyzeAsset
    const { mutate: uploadAndAnalyze, isPending } = useMutation({
        mutationFn: analyzeAsset,
        onSuccess: (data) => {
            // data는 이제 { topic: string, steps: ProcessStep[] } 형태의 ProcessDefinition입니다.
            onAnalyzeComplete(data);
        },
        onError: (err) => {
            console.error(err);
            alert("Failed to analyze file. Please try again.");
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet size={24} className="text-green-600" />;
        if (type.includes('image')) return <FileImage size={24} className="text-purple-600" />;
        return <FileText size={24} className="text-slate-600" />;
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <UploadCloud size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Analyze Assets</h3>
                            <p className="text-xs text-slate-500">Upload documents to auto-generate the process map.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Drop Area / Input */}
                    {!file ? (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:scale-110 transition-transform group-hover:bg-indigo-50">
                                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                                </div>
                                <p className="mb-2 text-sm text-slate-600 font-bold"><span className="text-indigo-600">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-slate-400">Images (PNG, JPG), Excel, or Text files</p>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".png,.jpg,.jpeg,.csv,.xlsx,.txt,.md" />
                        </label>
                    ) : (
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 relative">
                            <button
                                onClick={() => { setFile(null); setPreviewUrl(null); }}
                                className="absolute top-2 right-2 p-1 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <X size={14} />
                            </button>

                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                        {getFileIcon(file.type)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Info */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex gap-3 items-start">
                        <Sparkles size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-indigo-800">Direct Process Generation</p>
                            <p className="text-[11px] text-indigo-600 leading-relaxed">
                                AI will analyze the file and <b>directly generate the process map</b>, skipping the manual outlining step.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <AiActionButton
                        onClick={() => file && uploadAndAnalyze(file)}
                        disabled={!file}
                        isLoading={isPending}
                        loadingText="Analyzing Asset..."
                        className="shadow-lg"
                    >
                        Generate Map
                    </AiActionButton>
                </div>
            </div>
        </div>
    );
}