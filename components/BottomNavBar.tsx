import React from 'react';
import { CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon } from './icons';

interface BottomNavBarProps {
    view: 'calendar' | 'dashboard' | 'assignments';
    setView: (view: 'calendar' | 'dashboard' | 'assignments') => void;
}

const navItems = [
    { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
    { id: 'dashboard', label: 'لوحة التحكم', icon: ChartBarIcon },
    { id: 'assignments', label: 'التكليف', icon: ClipboardDocumentListIcon },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ view, setView }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = view === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as any)}
                            className={`flex flex-col items-center justify-center w-full transition-colors duration-200 p-2 ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
                        >
                            <Icon className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;