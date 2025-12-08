import type { ReactNode, ElementType } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface BaseModalProps {
    isOpen?: boolean; // 제어형 컴포넌트로 사용할 경우 (선택)
    onClose: () => void;
    title: ReactNode; // 텍스트 또는 컴포넌트 (PanelHeader와 유사)
    icon?: ElementType;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string; // 'max-w-2xl' 등 Tailwind 클래스
    className?: string; // 모달 컨테이너 추가 스타일
    hideCloseButton?: boolean;
}

export function BaseModal({
                              onClose,
                              title,
                              icon: Icon,
                              children,
                              footer,
                              maxWidth = "max-w-2xl",
                              className,
                              hideCloseButton = false
                          }: BaseModalProps) {
    // 모달 외부 클릭 시 닫기 (선택 사항 - 여기서는 배경 클릭 시 닫기 구현)
    // ESC 키 닫기 등 접근성 고려 가능

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop Click Handler (Optional) */}
            <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

            <div
                className={clsx(
                    "bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh]",
                    maxWidth,
                    className
                )}
                onClick={(e) => e.stopPropagation()} // 내부 클릭 전파 방지
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Icon size={20} />
                            </div>
                        )}
                        <div className="font-bold text-slate-800 text-lg">
                            {title}
                        </div>
                    </div>
                    {!hideCloseButton && (
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer (Optional) */}
                {footer && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}