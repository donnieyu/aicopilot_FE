import clsx from 'clsx';
import {
    User,
    Server,
    GitFork,
    AlertCircle,
    AlertTriangle,
    Info,
    FileText,
    CheckCircle2,
    Settings
} from 'lucide-react';
import type { ElementType } from 'react';

// 지원하는 뱃지 타입 정의
export type BadgeType =
    | 'USER_TASK'
    | 'SERVICE_TASK'
    | 'EXCLUSIVE_GATEWAY'
    | 'APPROVAL'
    | 'ERROR'
    | 'WARNING'
    | 'INFO'
    | 'SUCCESS'
    | 'DEFAULT';

interface StatusBadgeProps {
    type: string; // 문자열로 받아 내부에서 매핑
    label?: string; // 오버라이드할 라벨 (없으면 자동 설정)
    size?: 'sm' | 'md'; // 크기 옵션
    showIcon?: boolean;
    className?: string;
}

// 타입별 스타일 및 아이콘 매핑
const BADGE_CONFIG: Record<string, { bg: string; text: string; border?: string; icon: ElementType; label: string }> = {
    // Node Types
    USER_TASK: {
        bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100",
        icon: User, label: "User Task"
    },
    SERVICE_TASK: {
        bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100",
        icon: Server, label: "System Task"
    },
    EXCLUSIVE_GATEWAY: {
        bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100",
        icon: GitFork, label: "Gateway"
    },
    APPROVAL: {
        bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200",
        icon: FileText, label: "Approval"
    },

    // Status / Severity
    ERROR: {
        bg: "bg-red-100", text: "text-red-600", border: "border-red-200",
        icon: AlertCircle, label: "Error"
    },
    WARNING: {
        bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200",
        icon: AlertTriangle, label: "Warning"
    },
    INFO: {
        bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200",
        icon: Info, label: "Info"
    },
    SUCCESS: {
        bg: "bg-green-100", text: "text-green-600", border: "border-green-200",
        icon: CheckCircle2, label: "Success"
    },

    // Fallback
    DEFAULT: {
        bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200",
        icon: Settings, label: "Unknown"
    }
};

/**
 * 상태 및 타입 표시를 위한 표준 뱃지 컴포넌트
 */
export function StatusBadge({ type, label, size = 'sm', showIcon = true, className }: StatusBadgeProps) {
    // 입력된 type을 대문자로 변환하여 매핑 키 찾기 (매칭 안되면 DEFAULT)
    const normalizedType = type?.toUpperCase() || 'DEFAULT';

    // Config 찾기 (GATEWAY 등 부분 일치 처리 로직 포함 가능하나, 여기선 단순 매핑)
    let config = BADGE_CONFIG[normalizedType];

    if (!config) {
        // Fallback Logic
        if (normalizedType.includes('GATEWAY')) config = BADGE_CONFIG.EXCLUSIVE_GATEWAY;
        else if (normalizedType.includes('SERVICE') || normalizedType.includes('EMAIL')) config = BADGE_CONFIG.SERVICE_TASK;
        else if (normalizedType.includes('USER')) config = BADGE_CONFIG.USER_TASK;
        else config = BADGE_CONFIG.DEFAULT;
    }

    const Icon = config.icon;

    return (
        <span className={clsx(
            "inline-flex items-center gap-1 font-bold rounded-full border transition-colors select-none",
            config.bg, config.text, config.border,
            size === 'sm' ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
            className
        )}>
            {showIcon && <Icon size={size === 'sm' ? 10 : 12} />}
            <span>{label || config.label}</span>
        </span>
    );
}