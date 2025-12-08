import type { ButtonHTMLAttributes, ElementType } from 'react';
import clsx from 'clsx';

interface PanelToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isPanelOpen: boolean;
    label: string;
    icon: ElementType;
}

/**
 * 패널 열기/닫기 공통 버튼 컴포넌트
 * - Panel Open 상태 (Hide 버튼): 파란색 (Primary)
 * - Panel Closed 상태 (Show 버튼): 하얀색 (Secondary)
 */
export function PanelToggleButton({
                                      isPanelOpen,
                                      label,
                                      icon: Icon,
                                      className,
                                      ...props
                                  }: PanelToggleButtonProps) {
    return (
        <button
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all",
                // [Style Rule] Open(Hide) -> Blue, Closed(Show) -> White
                isPanelOpen
                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                    : "bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300",
                className
            )}
            title={label}
            {...props}
        >
            <Icon size={14} />
            <span>{label}</span>
        </button>
    );
}