
import React from 'react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: 'primary' | 'amber' | 'green' | 'red';
    onClick?: () => void;
    isActive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary', onClick, isActive }) => {
    const colorClasses = {
        primary: { bg: 'bg-primary', ring: 'ring-primary' },
        amber: { bg: 'bg-amber-500', ring: 'ring-amber-500' },
        green: { bg: 'bg-green-500', ring: 'ring-green-500' },
        red: { bg: 'bg-red-500', ring: 'ring-red-500' },
    };

    const activeClasses = isActive ? `ring-2 ring-offset-2 ${colorClasses[color].ring}` : 'shadow-md';
    const hoverClasses = onClick ? 'hover:shadow-lg hover:-translate-y-1 transform transition-all' : '';
    const cursorClass = onClick ? 'cursor-pointer' : '';

    return (
        <div 
            className={`bg-white p-6 rounded-lg flex items-center space-x-4 space-x-reverse ${activeClasses} ${hoverClasses} ${cursorClass}`}
            onClick={onClick}
            role={onClick ? 'button' : 'figure'}
            tabIndex={onClick ? 0 : -1}
            onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
            aria-pressed={isActive}
        >
            <div className={`p-4 rounded-full text-white ${colorClasses[color].bg}`}>
                {icon}
            </div>
            <div>
                <p className="text-text text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold text-dark">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
