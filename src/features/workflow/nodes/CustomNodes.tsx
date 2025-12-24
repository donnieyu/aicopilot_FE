import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Play, Square, X } from 'lucide-react';
import clsx from 'clsx';

// [Fix] 빌드 오류 해결을 위해 상대 경로를 사용하며 정확한 위치를 참조합니다.
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import { StatusBadge } from '../../../components/StatusBadge';
import type { Activity, AnalysisResult } from '../../../types/workflow';

/**
 * NudgeBadge 컴포넌트
 * - 움직임(bounce)이 없는 정적 아이콘으로 표시
 * - 클릭 시 상세 분석 결과를 담은 팝업 노출 (기존 방식 복구)
 */
const NudgeBadge = ({ results }: { results: AnalysisResult[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!results || results.length === 0) return null;

    // 가장 높은 심각도 찾기
    const hasError = results.some(r => r.severity === 'ERROR');
    const hasWarning = results.some(r => r.severity === 'WARNING');
    const severity = hasError ? 'ERROR' : hasWarning ? 'WARNING' : 'INFO';

    return (
        <div className="absolute -top-3 -right-3 z-30">
            {/* 정적인 아이콘 버튼 (클릭 시 팝업 토글) */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // 노드 클릭 이벤트 전파 방지
                    setIsOpen(!isOpen);
                }}
                className="shadow-lg rounded-full border-2 border-white bg-white flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
                title="감사 결과 확인"
            >
                <StatusBadge
                    type={severity}
                    label=""
                    className="!p-1.5 !rounded-full"
                />
            </button>

            {/* 클릭 시 노출되는 상세 팝업 (닫기 버튼 포함) */}
            {isOpen && (
                <div className="absolute top-8 right-0 w-64 bg-slate-900 text-white rounded-xl shadow-2xl p-4 z-[100] text-[11px] leading-relaxed animate-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
                        <span className="font-black uppercase tracking-tighter text-blue-400">AI Architect Insight</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {results.map((res, idx) => (
                            <div key={idx} className="flex items-start gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <span className={clsx(
                                    "mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0",
                                    res.severity === 'ERROR' ? "bg-red-500" :
                                        res.severity === 'WARNING' ? "bg-amber-500" : "bg-blue-500"
                                )}></span>
                                <div className="flex-1">
                                    <p className="font-bold text-white/90">{res.message}</p>
                                    {res.suggestion && (
                                        <div className="mt-1 p-1.5 bg-white/5 rounded border border-white/10">
                                            <p className="text-white/60 italic leading-tight">💡 {res.suggestion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// 공통 노드 스타일 래퍼
const BaseNode = ({
                      children,
                      selected,
                      className,
                      isTB,
                      nodeId
                  }: {
    children: React.ReactNode,
    selected?: boolean,
    className?: string,
    isTB?: boolean,
    nodeId?: string
}) => {
    const analysisResults = useWorkflowStore(state => nodeId ? state.analysisResults[nodeId] : undefined);

    return (
        <div className={clsx(
            "px-4 py-3 shadow-sm rounded-lg bg-white border-2 min-w-[150px] transition-all duration-200 relative",
            selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300",
            className
        )}>
            {analysisResults && <NudgeBadge results={analysisResults} />}
            <Handle type="target" position={isTB ? Position.Top : Position.Left} className="!bg-gray-400 !w-2 !h-2" />
            {children}
            <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="!bg-gray-400 !w-2 !h-2" />
        </div>
    );
};

// 1. User Task Node
export const UserTaskNode = memo(({ id, data, selected }: NodeProps<Activity>) => {
    const isApproval = data.configuration?.isApproval;
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-blue-500" isTB={isTB} nodeId={id}>
            <div className="flex items-center gap-3">
                <div className={clsx("p-1.5 rounded-lg", isApproval ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                    <StatusBadge type={isApproval ? 'APPROVAL' : 'USER_TASK'} label="" className="!p-0 !bg-transparent border-none" />
                </div>

                <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-900">{data.label}</h3>
                    {isApproval && <StatusBadge type="APPROVAL" size="sm" className="mt-1" />}
                </div>
            </div>
        </BaseNode>
    );
});

// 2. Service Task Node
export const ServiceTaskNode = memo(({ id, data, selected }: NodeProps<Activity>) => {
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-purple-500" isTB={isTB} nodeId={id}>
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                    <StatusBadge type="SERVICE_TASK" label="" className="!p-0 !bg-transparent border-none" />
                </div>
                <div>
                    <h3 className="text-xs font-bold text-gray-900">{data.label}</h3>
                </div>
            </div>
        </BaseNode>
    );
});

// 3. Gateway Node
export const GatewayNode = memo(({ id, data, selected }: NodeProps<Activity>) => {
    const isTB = (data as any).layoutDirection === 'TB';
    const analysisResults = useWorkflowStore(state => state.analysisResults[id]);

    return (
        <div className="relative z-10">
            {analysisResults && (
                <div className="absolute -top-6 -right-6 z-20">
                    <NudgeBadge results={analysisResults} />
                </div>
            )}

            <div className={clsx(
                "w-10 h-10 rotate-45 flex items-center justify-center bg-white border-2 shadow-sm transition-all",
                selected ? "border-green-500 ring-2 ring-green-200" : "border-gray-300"
            )}>
                <Handle type="target" position={isTB ? Position.Top : Position.Left} className="-rotate-45 !bg-gray-400 !w-2 !h-2" />
                <div className="-rotate-45">
                    <StatusBadge type="EXCLUSIVE_GATEWAY" label="" className="!p-0 !bg-transparent border-none" />
                </div>
                <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="-rotate-45 !bg-gray-400 !w-2 !h-2" />

                <div className="absolute -bottom-6 w-24 -rotate-45 text-center text-[10px] font-medium text-gray-500 whitespace-nowrap">
                    {data.label}
                </div>
            </div>
        </div>
    );
});

// 4. Start Node
export const StartNode = memo(({ data, selected }: NodeProps) => {
    const isTB = (data as any).layoutDirection === 'TB';
    return (
        <div className={clsx("flex flex-col items-center justify-center relative z-10", selected && "opacity-80")}>
            <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center shadow-sm">
                <Play size={20} className="text-green-600 fill-current ml-1" />
            </div>
            <span className="mt-1 text-xs font-bold text-gray-600">Start</span>
            <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="!bg-green-500 !w-3 !h-3" />
        </div>
    );
});

// 5. End Node
export const EndNode = memo(({ data, selected }: NodeProps) => {
    const isTB = (data as any).layoutDirection === 'TB';
    return (
        <div className={clsx("flex flex-col items-center justify-center relative z-10", selected && "opacity-80")}>
            <Handle type="target" position={isTB ? Position.Top : Position.Left} className="!bg-red-500 !w-3 !h-3" />
            <div className="w-10 h-10 rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center shadow-sm">
                <Square size={16} className="text-red-600 fill-current" />
            </div>
            <span className="mt-1 text-xs font-bold text-gray-600">End</span>
        </div>
    );
});

// 6. Swimlane Node
export const SwimlaneNode = memo(({ data }: NodeProps<{ label: string }>) => {
    return (
        <div className="h-full w-full bg-slate-50/30 border border-slate-200 rounded-sm relative flex flex-col">
            <div className="w-full py-1 bg-slate-100 border-b border-slate-200 px-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{data.label}</span>
            </div>
        </div>
    );
});