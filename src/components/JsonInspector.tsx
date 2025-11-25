import { useState } from 'react';
import { X, Copy, Check, FileJson, Database, LayoutTemplate } from 'lucide-react';
import clsx from 'clsx';
import type { JobStatus } from '../types/workflow'; // [Fix] import type 사용

interface JsonInspectorProps {
    isOpen: boolean;
    onClose: () => void;
    data: JobStatus | null;
}

type TabType = 'PROCESS' | 'DATA' | 'FORM';

export function JsonInspector({ isOpen, onClose, data }: JsonInspectorProps) {
    const [activeTab, setActiveTab] = useState<TabType>('PROCESS');
    const [copied, setCopied] = useState(false);

    // 탭별로 보여줄 데이터 선택
    const getJsonContent = () => {
        if (!data) return {};
        switch (activeTab) {
            case 'PROCESS': return data.processResponse || {};
            case 'DATA': return data.dataEntitiesResponse || {};
            case 'FORM': return data.formResponse || {};
            default: return {};
        }
    };

    const jsonString = JSON.stringify(getJsonContent(), null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={clsx(
                "fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* 1. Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                        <FileJson size={18} />
                    </div>
                    <h2 className="font-semibold text-gray-800">Generated Artifacts</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                    <X size={20} />
                </button>
            </div>

            {/* 2. Tabs */}
            <div className="flex border-b border-gray-200">
                <TabButton
                    active={activeTab === 'PROCESS'}
                    onClick={() => setActiveTab('PROCESS')}
                    icon={<FileJson size={16} />}
                    label="Process"
                />
                <TabButton
                    active={activeTab === 'DATA'}
                    onClick={() => setActiveTab('DATA')}
                    icon={<Database size={16} />}
                    label="Data Entities"
                />
                <TabButton
                    active={activeTab === 'FORM'}
                    onClick={() => setActiveTab('FORM')}
                    icon={<LayoutTemplate size={16} />}
                    label="Form UX"
                />
            </div>

            {/* 3. Code Viewer */}
            <div className="flex-1 overflow-hidden relative group bg-[#0d1117]">
                {/* Copy Button (Floating) */}
                <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition-all opacity-0 group-hover:opacity-100"
                    title="Copy JSON"
                >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>

                <div className="h-full overflow-auto p-4 custom-scrollbar">
          <pre className="text-xs font-mono leading-relaxed text-gray-300">
            {jsonString}
          </pre>
                </div>
            </div>

            {/* 4. Footer info */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between">
                <span>Job ID: {data?.jobId}</span>
                <span>Ver: {data?.version}</span>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                active
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
        >
            {icon}
            {label}
        </button>
    );
}