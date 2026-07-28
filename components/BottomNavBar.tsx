import React from 'react';
import { CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon, BriefcaseIcon, UserGroupIcon, QuickReportIcon, CogIcon, CheckCircleIcon, PlusIcon, DocumentTextIcon } from './icons';

interface BottomNavBarProps {
    view: string;
    setView: (v: any) => void;
    role: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ view, setView, role }) => {
    // تم إلغاء فلترة الأدوار لتظهر جميع الصفحات لجميع المستخدمين كما طلب العميل
    const items = [
        { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
        { id: 'add_session', label: 'إضافة', icon: PlusIcon },
        { id: 'attendance_report', label: 'الحضور', icon: CheckCircleIcon },
        { id: 'appeal_report', label: 'الاستئناف', icon: DocumentTextIcon },
        { id: 'unappealed_report', label: 'إلغاء غير مستأنف', icon: DocumentTextIcon },
        { id: 'assignments', label: 'الجلسات', icon: ClipboardDocumentListIcon },
        { id: 'quick_reports', label: 'الجودة', icon: QuickReportIcon },
        { id: 'settings', label: 'الإعدادات', icon: CogIcon },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around shadow-lg z-50">
            {items.map(i => (
                <button 
                    key={i.id} 
                    onClick={() => setView(i.id)} 
                    className={`flex flex-col items-center transition-all duration-300 w-16 ${
                        view === i.id || (i.id === 'quick_reports' && view === 'quality_results') 
                        ? 'text-primary scale-110' 
                        : 'text-gray-400 opacity-60'
                    }`}
                >
                    <i.icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">{i.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNavBar;
