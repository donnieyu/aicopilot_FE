import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Play, Square } from 'lucide-react';
import clsx from 'clsx';
import type { Activity, AnalysisResult } from '../../../types/workflow';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import { StatusBadge } from '../../../components/StatusBadge'; // [New] Import

// [New] Nudge Badge Component (Using StatusBadge)
const NudgeBadge = ({ results }: { results: AnalysisResult[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!results || results.length === 0) return null;

    // 가장 높은 심각도 찾기
    const hasError = results.some(r => r.severity === 'ERROR');
    const hasWarning = results.some(r => r.severity === 'WARNING');
    const severity = hasError ? 'ERROR' : hasWarning ? 'WARNING' : 'INFO';

    return (
        <div className="absolute -top-3 -right-3 z-20">
            {/* Badge Icon Button */}
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="transition-transform hover:scale-110 animate-in zoom-in duration-300 focus:outline-none"
            >
                {/* StatusBadge를 아이콘만 사용하는 형태로 재활용 (label 없이) */}
                <StatusBadge
                    type={severity}
                    label=""
                    className="!p-1.5 !rounded-full" // 원형으로 강제
                />
            </button>

            {/* Tooltip / Mini Popover */}
            {isOpen && (
                <div className="absolute top-8 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">AI Architect Insight</h4>
                    <div className="space-y-2">
                        {results.map((res, idx) => (
                            <div key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-2">
                                <StatusBadge type={res.severity} size="sm" showIcon={false} className="mt-0.5" />
                                <span className="flex-1">{res.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// BaseNode Wrapper (유지하되 내부 NudgeBadge만 변경됨)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-blue-500" isTB={isTB} nodeId={id}>
            <div className="flex items-center gap-3">
                {/* [Refactor] 아이콘 박스 대체 */}
                <div className={clsx("p-1.5 rounded-lg", isApproval ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                    {/* StatusBadge의 아이콘 로직 재사용 대신, 기존 레이아웃 유지하며 Badge만 추가 */}
                    {/* 여기서는 기존 아이콘 유지하고 텍스트 뱃지만 추가하는 것이 더 깔끔할 수 있음 */}
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTB = (data as any).layoutDirection === 'TB';
    const analysisResults = useWorkflowStore(state => state.analysisResults[id]);

    return (
        <div className="relative">
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

// 4. Start Node (유지)
export const StartNode = memo(({ data, selected }: NodeProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTB = (data as any).layoutDirection === 'TB';
    return (
        <div className={clsx("flex flex-col items-center justify-center", selected && "opacity-80")}>
            <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center shadow-sm">
                <Play size={20} className="text-green-600 fill-current ml-1" />
            </div>
            <span className="mt-1 text-xs font-bold text-gray-600">Start</span>
            <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="!bg-green-500 !w-3 !h-3" />
        </div>
    );
});

// 5. End Node (유지)
export const EndNode = memo(({ data, selected }: NodeProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTB = (data as any).layoutDirection === 'TB';
    return (
        <div className={clsx("flex flex-col items-center justify-center", selected && "opacity-80")}>
            <Handle type="target" position={isTB ? Position.Top : Position.Left} className="!bg-red-500 !w-3 !h-3" />
            <div className="w-10 h-10 rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center shadow-sm">
                <Square size={16} className="text-red-600 fill-current" />
            </div>
            <span className="mt-1 text-xs font-bold text-gray-600">End</span>
        </div>
    );
});

// 6. Swimlane Node (유지)
export const SwimlaneNode = memo(({ data }: NodeProps<{ label: string }>) => {
    return (
        <div className="h-full w-full bg-slate-50/30 border border-slate-200 rounded-sm relative flex flex-col">
            <div className="w-full py-1 bg-slate-100 border-b border-slate-200 px-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{data.label}</span>
            </div>
        </div>
    );
});