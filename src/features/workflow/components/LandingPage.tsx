import {
    Wand2,
    Users,
    Truck,
    Cpu,
    Stethoscope,
    Gavel,
    Megaphone,
    Plus,
    CreditCard,
    Plane,
    UploadCloud
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { AssetUploadModal } from './forms/AssetUploadModal';
import type { ProcessDefinition } from '../../../types/workflow';

interface LandingPageProps {
    onStart: (topic: string, description?: string) => void;
    // [Updated] Asset Viewer 연동을 위해 fileUrl 매개변수 추가
    onStartFromAsset: (definition: ProcessDefinition, fileUrl?: string) => void;
}

// 프리셋 데이터 정의 (아이콘, 색상, 설명 포함)
const TOPIC_PRESETS = [
    {
        id: 'hr',
        label: 'Human Resources',
        desc: 'Onboarding, Reviews, Offboarding',
        icon: Users,
        color: 'text-pink-500',
        bg: 'bg-pink-50 group-hover:bg-pink-100'
    },
    {
        id: 'finance',
        label: 'Finance & Accounting',
        desc: 'Expenses, Invoices, Budgeting',
        icon: CreditCard,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 group-hover:bg-emerald-100'
    },
    {
        id: 'it',
        label: 'IT Service',
        desc: 'Support Tickets, Access Control',
        icon: Cpu,
        color: 'text-blue-500',
        bg: 'bg-blue-50 group-hover:bg-blue-100'
    },
    {
        id: 'legal',
        label: 'Legal & Compliance',
        desc: 'Contract Review, GDPR Checks',
        icon: Gavel,
        color: 'text-slate-600',
        bg: 'bg-slate-50 group-hover:bg-slate-100'
    },
    {
        id: 'marketing',
        label: 'Marketing & Sales',
        desc: 'Campaign Launch, Lead Qual.',
        icon: Megaphone,
        color: 'text-orange-500',
        bg: 'bg-orange-50 group-hover:bg-orange-100'
    },
    {
        id: 'logistics',
        label: 'Logistics',
        desc: 'Procurement, Inventory, Shipping',
        icon: Truck,
        color: 'text-amber-500',
        bg: 'bg-amber-50 group-hover:bg-amber-100'
    },
    {
        id: 'healthcare',
        label: 'Healthcare',
        desc: 'Patient Intake, Insurance Claims',
        icon: Stethoscope,
        color: 'text-rose-500',
        bg: 'bg-rose-50 group-hover:bg-rose-100'
    },
    {
        id: 'travel',
        label: 'Travel & Events',
        desc: 'Trip Approval, Event Planning',
        icon: Plane,
        color: 'text-sky-500',
        bg: 'bg-sky-50 group-hover:bg-sky-100'
    },
];

export function LandingPage({ onStart, onStartFromAsset }: LandingPageProps) {
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decoration (Subtle gradients) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-6xl z-10 flex flex-col items-center space-y-10 animate-in fade-in zoom-in duration-700">

                {/* 1. Hero Header */}
                <div className="text-center space-y-4 max-w-2xl">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-lg shadow-blue-100/50 mb-2 border border-slate-100">
                        <Wand2 className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        What process do you want to <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">architect today?</span>
                    </h1>
                    <p className="text-lg text-slate-500 leading-relaxed">
                        Select a template below to start drafting immediately.
                    </p>
                </div>

                {/* 2. Topic Preset Grid (Suggestions) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {TOPIC_PRESETS.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => onStart(topic.label, '')}
                            className="group relative flex flex-col items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 text-left hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-3 mb-2 w-full">
                                <div className={clsx("p-2 rounded-xl transition-colors", topic.bg)}>
                                    <topic.icon className={clsx("w-5 h-5", topic.color)} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                                    {topic.label}
                                </h3>
                            </div>
                            <p className="text-[11px] text-slate-400 group-hover:text-slate-500 leading-snug line-clamp-2">
                                {topic.desc}
                            </p>
                            {/* Hover Arrow */}
                            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                                <ArrowRightIcon />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Divider with Text */}
                <div className="relative w-full max-w-2xl py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <span className="relative bg-slate-50 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Or Create Your Own
                    </span>
                </div>

                {/* 3. Main Action Buttons (Assets & Scratch) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
                    {/* Start from Assets */}
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="group flex items-center justify-between p-6 bg-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden"
                    >
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-indigo-50 rounded-full shadow-sm group-hover:scale-110 transition-transform text-indigo-600">
                                <UploadCloud className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700">
                                    Start from Assets
                                </h3>
                                <p className="text-sm text-slate-400 mt-1 font-medium">
                                    Analyze Image / Excel / PDF
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                            AI POWERED
                        </div>
                    </button>

                    {/* Start from Scratch */}
                    <button
                        onClick={() => onStart('', '')}
                        className="group flex items-center justify-between p-6 bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 text-left"
                    >
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-slate-50 rounded-full shadow-sm group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-600">
                                <Plus className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 text-lg group-hover:text-blue-700">
                                    Start from Scratch
                                </h3>
                                <p className="text-sm text-slate-400 mt-1 font-medium">
                                    Design a custom process
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* 4. Footer Message */}
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest pt-4">
                    Powered by AI Workflow Engine Ver 8.2
                </p>
            </div>

            {/* Asset Upload Modal */}
            {isUploadModalOpen && (
                <AssetUploadModal
                    onClose={() => setUploadModalOpen(false)}
                    // [Updated] onAnalyzeComplete에서 fileUrl을 받아 상위로 전달하도록 수정
                    onAnalyzeComplete={(definition, fileUrl) => {
                        setUploadModalOpen(false);
                        onStartFromAsset(definition, fileUrl);
                    }}
                />
            )}
        </div>
    );
}

// Simple Arrow Icon Component for local usage
function ArrowRightIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}