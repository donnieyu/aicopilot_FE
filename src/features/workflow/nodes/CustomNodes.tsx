import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { User, Server, GitFork, Mail, FileText, Play, Square } from 'lucide-react';
import clsx from 'clsx';
import type { Activity } from '../../../types/workflow';

// 공통 노드 래퍼
const BaseNode = ({
                      children,
                      selected,
                      className,
                      isTB
                  }: {
    children: React.ReactNode,
    selected?: boolean,
    className?: string,
    isTB?: boolean
}) => (
    <div className={clsx(
        "px-4 py-3 shadow-sm rounded-lg bg-white border-2 min-w-[150px] transition-all duration-200",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300",
        className
    )}>
        {/* 입력 핸들: TB일 때 Top, LR일 때 Left */}
        <Handle type="target" position={isTB ? Position.Top : Position.Left} className="!bg-gray-400 !w-2 !h-2" />

        {children}

        {/* 출력 핸들: TB일 때 Bottom, LR일 때 Right */}
        <Handle type="source" position={isTB ? Position.Bottom : Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
);

// 1. User Task Node
export const UserTaskNode = memo(({ data, selected }: NodeProps<Activity>) => {
    const isApproval = data.configuration?.isApproval;
    // data에 layoutDirection이 없을 경우 기본값 LR 사용 (TB일 때만 true)
    // any 타입 캐스팅을 통해 layoutDirection 접근 (Activity 타입에 명시되지 않았을 수 있음)
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-blue-500" isTB={isTB}>
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
export const ServiceTaskNode = memo(({ data, selected }: NodeProps<Activity>) => {
    const configType = data.configuration?.configType;
    const isEmail = configType === 'EMAIL_CONFIG';
    const isTB = (data as any).layoutDirection === 'TB';

    return (
        <BaseNode selected={selected} className="border-l-4 border-l-purple-500" isTB={isTB}>
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
export const GatewayNode = memo(({ data, selected }: NodeProps<Activity>) => {
    const isTB = (data as any).layoutDirection === 'TB';
    return (
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