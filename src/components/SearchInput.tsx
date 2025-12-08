import { Search } from 'lucide-react';
import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    placeholder?: string;
    className?: string;
    containerClassName?: string;
}

export function SearchInput({
                                placeholder = "Search...",
                                className,
                                containerClassName,
                                ...props
                            }: SearchInputProps) {
    return (
        <div className={clsx("relative", containerClassName)}>
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
            />
            <input
                type="text"
                placeholder={placeholder}
                className={clsx(
                    "w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400",
                    className
                )}
                {...props}
            />
        </div>
    );
}