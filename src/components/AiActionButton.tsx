import { ButtonHTMLAttributes } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface AiActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    icon?: React.ElementType; // 기본값 Sparkles
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
}

export function AiActionButton({
                                   children,
                                   isLoading,
                                   loadingText = "Generating...",
                                   icon: Icon = Sparkles,
                                   variant = 'primary',
                                   fullWidth = false,
                                   className,
                                   disabled,
                                   ...props
                               }: AiActionButtonProps) {

    // 스타일 정의
    const baseStyles = "relative flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
        primary: "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-[length:200%_auto] text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:bg-right",
        secondary: "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:border-blue-200",
        ghost: "bg-transparent text-blue-600 hover:bg-blue-50"
    };

    return (
        <button
            className={clsx(
                baseStyles,
                variants[variant],
                fullWidth ? "w-full py-3 text-sm" : "px-6 py-2 text-sm",
                isLoading && "cursor-wait", // 로딩 중 커서 변경
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* 로딩 중일 때 */}
            {isLoading ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{loadingText}</span>
                </>
            ) : (
                /* 평상시 */
                <>
                    <Icon size={18} className={clsx("transition-transform group-hover:scale-110", variant === 'primary' ? "text-blue-100" : "text-current")} />
                    <span>{children}</span>
                </>
            )}

            {/* Primary일 때만 반짝이는 효과 추가 (선택 사항) */}
            {variant === 'primary' && !isLoading && !disabled && (
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 pointer-events-none"></span>
            )}
        </button>
    );
}