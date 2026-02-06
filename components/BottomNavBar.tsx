import React from 'react';
import { CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon, BriefcaseIcon } from './icons';

interface BottomNavBarProps {
    view: 'calendar' | 'dashboard' | 'assignments' | 'lawyer_report';
    setView: (view: 'calendar' | 'dashboard' | 'assignments' | 'lawyer_report') => void;
}

const navItems = [
    { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
    { id: 'dashboard', label: 'لوحة التحكم', icon: ChartBarIcon },
    { id: 'assignments', label: 'التكليف', icon: ClipboardDocumentListIcon },
    { id: 'lawyer_report', label: 'المندوبين', icon: BriefcaseIcon },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ view, setView }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-[100] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
                {navItems.map((item) => {
                    const isActive = view === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as any)}
                            className={`relative flex flex-col items-center justify-center w-full transition-all duration-300 p-2 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-text'}`}
                        >
                            {/* Active Indicator Bar - Top line for clarity */}
                            {isActive && (
                                <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-full animate-in slide-in-from-top-1 duration-300"></span>
                            )}
                            
                            <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'drop-shadow-[0_0_8px_rgba(140,120,81,0.2)]' : ''}`} />
                            </div>
                            
                            <span className={`text-[10px] font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;