import { Wand2, BrainCircuit, Layout, Database, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface GeneratingOverlayProps {
    message: string;
    isVisible: boolean;
}

export function GeneratingOverlay({ message, isVisible }: GeneratingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-full max-w-md space-y-8 text-center">

                {/* Animated Icon Container */}
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-12 h-12 text-blue-600 animate-pulse" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">Architecting Structure</h2>
                    <p className="text-slate-500 text-lg animate-pulse">{message || "Analyzing requirements..."}</p>
                </div>

                {/* Steps Progress (Visual Only) */}
                <div className="flex justify-center gap-8 pt-4">
                    <StepIndicator icon={BrainCircuit} label="Analyzing" active={true} completed={false} />
                    <StepIndicator icon={Layout} label="Mapping" active={message?.includes("Map")} completed={message?.includes("Data")} />
                    <StepIndicator icon={Database} label="Modeling" active={message?.includes("Data")} completed={false} />
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ icon: Icon, label, active, completed }: { icon: any, label: string, active: boolean, completed: boolean }) {
    return (
        <div className={clsx("flex flex-col items-center gap-2 transition-all duration-500", (active || completed) ? "opacity-100 transform scale-110" : "opacity-40")}>
            <div className={clsx(
                "p-3 rounded-full border-2 transition-colors duration-500",
                completed ? "bg-green-100 border-green-500 text-green-600" :
                    active ? "bg-blue-100 border-blue-500 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400"
            )}>
                {completed ? <CheckCircle2 size={20} /> : <Icon size={20} className={active ? "animate-bounce" : ""} />}
            </div>
            <span className={clsx("text-xs font-bold", (active || completed) ? "text-slate-700" : "text-slate-400")}>{label}</span>
        </div>
    );
}