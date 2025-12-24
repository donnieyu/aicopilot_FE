import { Loader2 } from 'lucide-react';

interface GeneratingOverlayProps {
    message: string;
    isVisible: boolean;
}

/**
 * [Refinement] 캔버스 영역 미니 오버레이
 * - 사용자의 요청에 따라 텍스트 메시지를 삭제하고 시각적 로딩 표시만 남겼습니다.
 * - 메시지는 이제 ChatInterface의 말풍선 내부에서 실시간으로 확인할 수 있습니다.
 */
export function GeneratingOverlay({ isVisible }: GeneratingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-[45] bg-slate-500/10 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
            {/* 미니멀한 플로팅 인디케이터 (메시지 생략) */}
            <div className="bg-white/80 backdrop-blur border border-blue-50 px-4 py-4 rounded-full shadow-2xl flex items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                    <div className="p-3 bg-blue-600 text-white rounded-full relative z-10 shadow-lg shadow-blue-200">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                </div>
            </div>
        </div>
    );
}