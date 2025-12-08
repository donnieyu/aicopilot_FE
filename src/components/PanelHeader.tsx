import type { ReactNode, ElementType } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface PanelHeaderAction {
    icon: ElementType;
    label?: string;
    onClick: (e: React.MouseEvent) => void;
    title?: string;
    variant?: 'default' | 'ghost' | 'danger';
}

interface PanelHeaderProps {
    title: ReactNode; // 텍스트 또는 컴포넌트
    icon?: ElementType; // 왼쪽 아이콘
    subTitle?: string;
    className?: string;

    // 왼쪽 아이콘 배경색 스타일 (옵션)
    iconClassName?: string;

    // 우측 액션 버튼들
    actions?: PanelHeaderAction[];

    // 닫기 버튼 (단축 속성)
    onClose?: () => void;
}

/**
 * 표준화된 패널 헤더 컴포넌트
 */
export function PanelHeader({
                                title,
                                icon: Icon,
                                subTitle,
                                className,
                                iconClassName,
                                actions = [],
                                onClose
                            }: PanelHeaderProps) {
    return (
        <div className={clsx("px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white/80 z-10 flex-shrink-0", className)}>
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className={clsx("p-1.5 rounded-lg transition-colors", iconClassName || "bg-indigo-100 text-indigo-600")}>
                        <Icon size={16} />
                    </div>
                )}
                <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {title}
                    </h4>
                    {subTitle && <p className="text-[10px] text-slate-500 mt-0.5">{subTitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={action.onClick}
                        className={clsx(
                            "rounded transition-colors flex items-center gap-1",
                            action.label ? "px-2 py-1 text-[10px] font-bold" : "p-1",
                            action.variant === 'ghost' || !action.variant ? "hover:bg-slate-200 text-slate-400 hover:text-slate-600 bg-transparent" : "",
                            action.variant === 'default' ? "bg-slate-200/50 hover:bg-white border border-transparent hover:border-slate-200 text-slate-500" : ""
                        )}
                        title={action.title}
                    >
                        <action.icon size={action.label ? 10 : 16} />
                        {action.label && <span>{action.label}</span>}
                    </button>
                ))}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}