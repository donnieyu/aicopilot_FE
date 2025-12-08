import { useEffect, useState } from 'react';
import type { ReactNode, ElementType } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface BaseModalProps {
    isOpen?: boolean;
    onClose: () => void;
    title: ReactNode;
    icon?: ElementType;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
    className?: string;
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
    // Portal을 위한 마운트 상태 관리 (SSR 이슈 방지 및 클라이언트 렌더링 보장)
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 모달 오픈 시 body 스크롤 방지 (선택 사항)
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!mounted) return null;

    // Portal을 사용하여 document.body에 렌더링
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop Click Handler */}
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
        </div>,
        document.body // 렌더링 타겟
    );
}