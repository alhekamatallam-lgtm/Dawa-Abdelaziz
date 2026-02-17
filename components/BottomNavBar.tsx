
import React from 'react';
import { CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon, BriefcaseIcon, UserGroupIcon } from './icons';

interface BottomNavBarProps {
    view: string;
    setView: (v: any) => void;
    role: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ view, setView, role }) => {
    // تم إلغاء فلترة الأدوار لتظهر جميع الصفحات لجميع المستخدمين كما طلب العميل
    const items = [
        { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
        { id: 'dashboard', label: 'التحكم', icon: ChartBarIcon },
        { id: 'assignments', label: 'الجلسات', icon: ClipboardDocumentListIcon },
        { id: 'lawyer_report', label: 'المندوبين', icon: BriefcaseIcon },
        { id: 'plaintiff_report', label: 'المدعين', icon: UserGroupIcon },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around shadow-lg z-50">
            {items.map(i => (
                <button 
                    key={i.id} 
                    onClick={() => setView(i.id)} 
                    className={`flex flex-col items-center transition-all duration-300 ${view === i.id ? 'text-primary scale-110' : 'text-gray-400 opacity-60'}`}
                >
                    <i.icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">{i.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNavBar;
