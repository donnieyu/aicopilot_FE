import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { User, Server, GitFork, Mail, FileText, Play, Square, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';
import type { Activity, AnalysisResult } from '../../../types/workflow';
import { useWorkflowStore } from '../../../store/useWorkflowStore'; // [New] Store import

// [New] Nudge Badge Component
const NudgeBadge = ({ results }: { results: AnalysisResult[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!results || results.length === 0) return null;

    // 가장 높은 심각도 찾기
    const hasError = results.some(r => r.severity === 'ERROR');
    const hasWarning = results.some(r => r.severity === 'WARNING');

    const colorClass = hasError ? "bg-red-100 text-red-600 border-red-200" :
        hasWarning ? "bg-amber-100 text-amber-600 border-amber-200" :
            "bg-blue-100 text-blue-600 border-blue-200";

    return (
        <div className="absolute -top-3 -right-3 z-20">
            {/* Badge Icon */}
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={clsx(
                    "p-1.5 rounded-full border shadow-sm transition-transform hover:scale-110 flex items-center justify-center animate-in zoom-in duration-300",
                    colorClass
                )}
            >
                {hasError ? <AlertCircle size={14} /> : <Info size={14} />}
            </button>

            {/* Tooltip / Mini Popover */}
            {isOpen && (
                <div className="absolute top-8 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">AI Architect Insight</h4>
                    <div className="space-y-2">
                        {results.map((res, idx) => (
                            <div key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                <span className={clsx("font-bold text-[10px] mr-1",
                                    res.severity === 'ERROR' ? 'text-red-500' : 'text-blue-500'
                                )}>[{res.severity}]</span>
                                {res.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// [New] BaseNode Wrapper with Nudge Badge Logic
const BaseNode = ({
                      children,
                      selected,
                      className,
                      isTB,
                      nodeId // [New] nodeId prop added
                  }: {
    children: React.ReactNode,
    selected?: boolean,
    className?: string,
    isTB?: boolean,
    nodeId?: string
}) => {
    // [New] Store에서 현재 노드에 해당하는 분석 결과 가져오기
    // nodeId가 없을 수 있는(Start/End 등) 경우 방어 코드
    const analysisResults = useWorkflowStore(state => nodeId ? state.analysisResults[nodeId] : undefined);

    return (
        <div className={clsx(
            "px-4 py-3 shadow-sm rounded-lg bg-white border-2 min-w-[150px] transition-all duration-200 relative",
            selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300",
            className
        )}>
            {/* Nudge Badge 추가 */}
            {analysisResults && <NudgeBadge results={analysisResults} />}

            {/* 입력 핸들: TB일 때 Top, LR일 때 Left */}
            <Handle type="target" position={isTB ? Position.Top : Position.Left} className="!bg-gray-400 !w-2 !h-2" />

            {children}

            {/* 출력 핸들: TB일 때 Bottom, LR일 때 Right */}
            <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="!bg-gray-400 !w-2 !h-2" />
        </div>
    );
};

// 1. User Task Node
export const UserTaskNode = memo(({ id, data, selected }: NodeProps<Activity>) => {
    const isApproval = data.configuration?.isApproval;
    // any 타입 캐스팅을 통해 layoutDirection 접근
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-blue-500" isTB={isTB} nodeId={id}>
            <div className="flex items-center gap-3">
                <div className={clsx("p-1.5 rounded-lg", isApproval ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                    {isApproval ? <FileText size={16} /> : <User size={16} />}
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-900">{data.label}</h3>
                    {isApproval && <span className="text-[10px] text-orange-600 font-medium">Approval</span>}
                </div>
            </div>
        </BaseNode>
    );
});

// 2. Service Task Node
export const ServiceTaskNode = memo(({ id, data, selected }: NodeProps<Activity>) => {
    const configType = data.configuration?.configType;
    const isEmail = configType === 'EMAIL_CONFIG';
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-purple-500" isTB={isTB} nodeId={id}>
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                    {isEmail ? <Mail size={16} /> : <Server size={16} />}
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
    // [New] Gateway도 분석 대상이므로 Store 조회
    const analysisResults = useWorkflowStore(state => state.analysisResults[id]);

    return (
        <div className="relative">
            {/* Gateway용 Nudge Badge 위치 조정 (다이아몬드 형태라 별도 처리) */}
            {analysisResults && (
                <div className="absolute -top-6 -right-6 z-20">
                    <NudgeBadge results={analysisResults} />
                </div>
            )}

            <div className={clsx(
                "w-10 h-10 rotate-45 flex items-center justify-center bg-white border-2 shadow-sm transition-all",
                selected ? "border-green-500 ring-2 ring-green-200" : "border-gray-300"
            )}>
                {/* 핸들 위치 동적 변경 */}
                <Handle type="target" position={isTB ? Position.Top : Position.Left} className="-rotate-45 !bg-gray-400 !w-2 !h-2" />
                <div className="-rotate-45 text-green-600">
                    <GitFork size={16} />
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
        <div className={clsx("flex flex-col items-center justify-center", selected && "opacity-80")}>
            <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center shadow-sm">
                <Play size={20} className="text-green-600 fill-current ml-1" />
            </div>
            <span className="mt-1 text-xs font-bold text-gray-600">Start</span>
            {/* Source only */}
            <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="!bg-green-500 !w-3 !h-3" />
        </div>
    );
});

// 5. End Node
export const EndNode = memo(({ data, selected }: NodeProps) => {
    const isTB = (data as any).layoutDirection === 'TB';
    return (
        <div className={clsx("flex flex-col items-center justify-center", selected && "opacity-80")}>
            {/* Target only */}
            <Handle type="target" position={isTB ? Position.Top : Position.Left} className="!bg-red-500 !w-3 !h-3" />
            <div className="w-10 h-10 rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center shadow-sm">
                <Square size={16} className="text-red-600 fill-current" />
            </div>
            <span className="mt-1 text-xs font-bold text-gray-600">End</span>
        </div>
    );
});

// 6. Swimlane Node (가로형)
export const SwimlaneNode = memo(({ data }: NodeProps<{ label: string }>) => {
    return (
        <div className="h-full w-full bg-slate-50/30 border border-slate-200 rounded-sm relative flex flex-col">
            {/* 헤더를 왼쪽에 세로로 표시하거나 상단에 표시. 여기선 상단 유지 */}
            <div className="w-full py-1 bg-slate-100 border-b border-slate-200 px-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{data.label}</span>
            </div>
        </div>
    );
});