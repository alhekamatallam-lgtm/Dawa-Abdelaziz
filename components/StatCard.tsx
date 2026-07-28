import React from 'react';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'amber' | 'green' | 'red' | 'blue' | 'purple';
    onClick?: () => void;
    isActive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color = 'primary', onClick, isActive }) => {
    const colorClasses = {
        primary: { bg: 'bg-primary', ring: 'ring-primary' },
        amber: { bg: 'bg-amber-500', ring: 'ring-amber-500' },
        green: { bg: 'bg-emerald-600', ring: 'ring-emerald-600' },
        red: { bg: 'bg-red-500', ring: 'ring-red-500' },
        blue: { bg: 'bg-blue-600', ring: 'ring-blue-600' },
        purple: { bg: 'bg-purple-600', ring: 'ring-purple-600' },
    };

    const colorScheme = colorClasses[color] || colorClasses.primary;

    const activeClasses = isActive ? `ring-2 ring-offset-2 ${colorScheme.ring}` : 'shadow-md';
    const hoverClasses = onClick ? 'hover:shadow-lg hover:-translate-y-1 transform transition-all' : '';
    const cursorClass = onClick ? 'cursor-pointer' : '';

    return (
        <div 
            className={`bg-white p-6 rounded-2xl border border-border flex items-center space-x-4 space-x-reverse ${activeClasses} ${hoverClasses} ${cursorClass}`}
            onClick={onClick}
            role={onClick ? 'button' : 'figure'}
            tabIndex={onClick ? 0 : -1}
            onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
            aria-pressed={isActive}
        >
            <div className={`p-3.5 rounded-2xl text-white ${colorScheme.bg} shrink-0`}>
                {icon}
            </div>
            <div className="text-right flex-1">
                <p className="text-dark/60 text-xs font-bold">{title}</p>
                <p className="text-2xl font-black text-dark mt-0.5">{value}</p>
                {subtitle && <p className="text-[11px] font-medium text-dark/50 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};

export default StatCard;