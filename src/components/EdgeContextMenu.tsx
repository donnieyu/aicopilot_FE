import { User, Server, GitFork, X } from 'lucide-react';
import clsx from 'clsx';

interface EdgeContextMenuProps {
    x: number;
    y: number;
    onSelect: (type: 'USER_TASK' | 'SERVICE_TASK' | 'EXCLUSIVE_GATEWAY') => void;
    onClose: () => void;
}

export function EdgeContextMenu({ x, y, onSelect, onClose }: EdgeContextMenuProps) {
    const options = [
        { type: 'USER_TASK', label: 'User Task', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
        { type: 'SERVICE_TASK', label: 'Service Task', icon: Server, color: 'text-purple-600', bg: 'bg-purple-50' },
        { type: 'EXCLUSIVE_GATEWAY', label: 'Gateway', icon: GitFork, color: 'text-orange-600', bg: 'bg-orange-50' },
    ] as const;

    return (
        <div
            className="absolute z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 flex flex-col gap-1 w-40 animate-in zoom-in-95 duration-200"
            style={{ left: x, top: y }}
        >
            <div className="flex justify-between items-center px-2 py-1 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Insert Node</span>
                <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
            </div>

            {options.map((opt) => (
                <button
                    key={opt.type}
                    onClick={() => onSelect(opt.type)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                    <div className={clsx("p-1.5 rounded-md transition-colors", opt.bg, opt.color)}>
                        <opt.icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                        {opt.label}
                    </span>
                </button>
            ))}
        </div>
    );
}