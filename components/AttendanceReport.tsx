import React, { useMemo, useState } from 'react';
import type { CaseSession } from '../types';
import StatCard from './StatCard';
import { CheckCircleIcon, DocumentTextIcon, CalendarIcon, ClockIcon, UserIcon, ArrowRightIcon, ChevronDownIcon, PrinterIcon } from './icons';

interface AttendanceReportProps {
    sessions: CaseSession[];
    onSessionClick?: (session: CaseSession) => void;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ sessions, onSessionClick }) => {
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isCancelledOpen, setIsCancelledOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [printMode, setPrintMode] = useState<'all' | 'annulment'>('all');

    const attendedSessions = useMemo(() => {
        return sessions.filter(s => s['حضور الجلسة'] === 'حضرت');
    }, [sessions]);

    const stats = useMemo(() => {
        const totalAttended = attendedSessions.length;
        const withMinutes = attendedSessions.filter(s => s['محضر الجلسة'] && s['محضر الجلسة'].trim() !== '').length;
        const withoutMinutes = totalAttended - withMinutes;
        const cancelledDecisionSessions = sessions.filter(s => 
            s['حالة_الدعوى'] === 'إلغاء القرار' || s['حالة_الدعوى'] === 'تنفيذ حكم إلغاء القرار'
        );
        const cancelledDecisionCount = cancelledDecisionSessions.length;
        
        return { totalAttended, withMinutes, withoutMinutes, cancelledDecisionCount, cancelledDecisionSessions };
    }, [attendedSessions, sessions]);

    const handleExportPDF = () => {
        setPrintMode('all');
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handlePrintAnnulment = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPrintMode('annulment');
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-primary/10 p-8 rounded-[2.5rem] border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                        <CheckCircleIcon className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-dark tracking-tight">تقرير حضور الجلسات</h2>
                        <p className="text-dark/60 font-medium">استعراض الجلسات التي تم حضورها ومحاضرها المسجلة</p>
                    </div>
                </div>
                <button 
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-dark transition-all"
                >
                    <DocumentTextIcon className="w-5 h-5" />
                    تصدير PDF
                </button>
            </div>

            {/* Print Only Section */}
            <div className="hidden print:block">
                <img 
                    src="https://russeellcloud.k.frappe.cloud/files/header.jpg" 
                    alt="Official Header" 
                    className="w-full h-auto"
                    referrerPolicy="no-referrer"
                />
                
                {printMode === 'all' ? (
                    <>
                        <div className="text-center mt-6 space-y-2 border-b-2 border-primary pb-6">
                            <h1 className="text-3xl font-black text-dark">تقرير حضور الجلسات</h1>
                            <div className="flex justify-center gap-12 mt-4">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-text/50 uppercase">إجمالي الجلسات المحضورة</p>
                                    <p className="text-xl font-black text-primary">{stats.totalAttended}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-text/50 uppercase">جلسات بمحضر مسجل</p>
                                    <p className="text-xl font-black text-green-600">{stats.withMinutes}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-text/50 uppercase">حكما بإلغاء القرار</p>
                                    <p className="text-xl font-black text-green-600">{stats.cancelledDecisionCount}</p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-dark my-6 border-r-4 border-primary pr-4">جدول الجلسات المحضورة</h2>
                        <table className="w-full border-collapse border border-border text-right mb-12">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم الجلسة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المدعي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">محضر الجلسة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendedSessions.map((session) => (
                                    <tr key={session.id} className="print:break-inside-avoid">
                                        <td className="border border-border p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['رقم المخالفة'] || '-'}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                        <td className="border border-border p-4 text-sm font-medium text-dark leading-relaxed">
                                            {session['محضر الجلسة'] || 'لا يوجد محضر'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div className="text-center mt-6 space-y-2 border-b-2 border-green-600 pb-6">
                        <h1 className="text-3xl font-black text-dark">تقرير أحكام إلغاء القرار</h1>
                        <p className="text-green-700 font-bold">حصر الأحكام النهائية الصادرة بإلغاء القرارات</p>
                    </div>
                )}

                {stats.cancelledDecisionSessions.length > 0 && (
                    <div className={`${printMode === 'all' ? 'break-before-page mt-12' : 'mt-8'}`}>
                        {/* Verdict Card for Print */}
                        <div className="mb-8 p-10 border-4 border-green-600 rounded-[3rem] bg-green-50/30 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-8">
                                <div className="p-5 bg-white rounded-[2rem] shadow-md border border-green-200">
                                    <CheckCircleIcon className="w-14 h-14 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-green-900 tracking-tight">حكم بإلغاء القرار</h2>
                                    <p className="text-lg font-bold text-green-700 mt-2">توثيق الأحكام الصادرة بإلغاء القرارات المطعون عليها</p>
                                </div>
                            </div>
                            <div className="text-left border-r-2 border-green-600/20 pr-8">
                                <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">العدد الإجمالي</p>
                                <p className="text-5xl font-black text-green-900">{stats.cancelledDecisionCount}</p>
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-dark mb-4 border-r-4 border-green-600 pr-4">جدول صدور إلغاء القرار</h2>
                        <table className="w-full border-collapse border border-border text-right mb-12">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم الجلسة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المدعي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المحكمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.cancelledDecisionSessions.map((session) => (
                                    <tr key={session.id} className="print:break-inside-avoid">
                                        <td className="border border-border p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['رقم المخالفة'] || '-'}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                        <td className="border border-border p-4 text-sm font-medium text-dark italic">
                                            {session['المحكمة']}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-12 text-center text-xs text-text/40 mb-8 italic">
                    تم استخراج هذا التقرير ({printMode === 'all' ? 'شامل' : 'أحكام إلغاء القرار فقط'}) بتاريخ {new Date().toLocaleDateString('ar-SA')}
                </div>
                <img 
                    src="https://russeellcloud.k.frappe.cloud/files/footer.jpg" 
                    alt="Official Footer" 
                    className="w-full h-auto mt-auto"
                    referrerPolicy="no-referrer"
                />
            </div>

            {/* Stats Cards - Hidden in Print */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
                <StatCard 
                    title="إجمالي الجلسات المحضورة" 
                    value={stats.totalAttended} 
                    icon={<CheckCircleIcon className="w-8 h-8" />} 
                    color="primary"
                />
                <StatCard 
                    title="جلسات بمحضر مسجل" 
                    value={stats.withMinutes} 
                    icon={<DocumentTextIcon className="w-8 h-8" />} 
                    color="green"
                />
                <StatCard 
                    title="جلسات بدون محضر" 
                    value={stats.withoutMinutes} 
                    icon={<DocumentTextIcon className="w-8 h-8" />} 
                    color="amber"
                />
                <StatCard 
                    title="حكم بإلغاء القرار" 
                    value={stats.cancelledDecisionCount} 
                    icon={<CheckCircleIcon className="w-8 h-8" />} 
                    color="green"
                />
            </div>

            {/* Summary Table - Visible in UI */}
            <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden print:hidden">
                <button 
                    onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                    className="w-full p-6 border-b border-border bg-light/30 flex items-center justify-between hover:bg-light/50 transition-colors"
                >
                    <h3 className="text-xl font-bold text-dark flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-primary" />
                        جدول ملخص الجلسات المحضورة
                    </h3>
                    <ChevronDownIcon className={`w-6 h-6 text-dark/40 transition-transform duration-300 ${isSummaryOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${isSummaryOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-right">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">رقم الجلسة</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">رقم المخالفة</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">المدعي</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">محضر الجلسة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendedSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-text/50 font-bold">لا توجد بيانات للعرض</td>
                                    </tr>
                                ) : (
                                    attendedSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-light/50 transition-colors border-b border-border last:border-0">
                                            <td className="p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['رقم المخالفة'] || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                            <td className="p-4 text-sm font-medium text-text/80 max-w-xs truncate">
                                                {session['محضر الجلسة'] || 'لا يوجد محضر'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Cancelled Decisions Table - Visible in UI */}
            <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden print:hidden">
                <button 
                    onClick={() => setIsCancelledOpen(!isCancelledOpen)}
                    className="w-full p-6 border-b border-border bg-green-50 flex items-center justify-between hover:bg-green-100/50 transition-colors"
                >
                    <div className="flex items-center gap-4 flex-1">
                        <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                            جدول صدور إلغاء القرار
                        </h3>
                        <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-black rounded-md">جديد</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrintAnnulment}
                            className="p-2 bg-white text-green-700 rounded-xl border border-green-200 hover:bg-green-100 transition-colors shadow-sm flex items-center gap-2"
                            title="تصدير الأحكام فقط"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            <span className="text-xs font-bold hidden md:inline">تصدير الأحكام</span>
                        </button>
                        <div className="p-2 bg-green-100 rounded-xl">
                            <ChevronDownIcon className={`w-6 h-6 text-green-700/60 transition-transform duration-300 ${isCancelledOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${isCancelledOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pb-0">
                        {/* UI Card for Annulment */}
                        <div className="mb-6 p-6 border-2 border-green-600 rounded-3xl bg-green-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-green-100">
                                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-green-900 leading-none">حكم بإلغاء القرار</h4>
                                    <p className="text-xs font-bold text-green-700 mt-1 opacity-70">توثيق الأحكام الصادرة بالإلغاء</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-green-600 uppercase mb-1">العدد</p>
                                <p className="text-3xl font-black text-green-900">{stats.cancelledDecisionCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-right">
                            <thead>
                                <tr className="bg-green-50/50">
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">رقم الجلسة</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">رقم المخالفة</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">المدعي</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">المحكمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.cancelledDecisionSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-text/50 font-bold">لا توجد قرارات ملغاة حالياً</td>
                                    </tr>
                                ) : (
                                    stats.cancelledDecisionSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-green-50/30 transition-colors border-b border-border last:border-0">
                                            <td className="p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['رقم المخالفة'] || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                            <td className="p-4 text-sm font-medium text-text/80">
                                                {session['المحكمة']}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sessions List - Hidden in Print */}
            <div className="space-y-4 print:hidden">
                <button 
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    className="w-full flex items-center justify-between group"
                >
                    <h3 className="text-xl font-bold text-dark border-r-4 border-primary pr-4">تفاصيل الجلسات المحضورة</h3>
                    <div className="p-2 bg-light rounded-xl group-hover:bg-primary/10 transition-colors">
                        <ChevronDownIcon className={`w-5 h-5 text-dark/40 group-hover:text-primary transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>
                
                <div className={`transition-all duration-300 overflow-hidden ${isDetailsOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {attendedSessions.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2rem] border border-dashed border-border text-center mt-6">
                            <DocumentTextIcon className="w-16 h-16 text-text/20 mx-auto mb-4" />
                            <p className="text-text/60 font-bold">لا توجد جلسات محضورة مسجلة حالياً</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 mt-6">
                            {attendedSessions.map((session) => (
                                <div 
                                    key={session.id}
                                    onClick={() => onSessionClick?.(session)}
                                    className="bg-white rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                                >
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                                                        تم الحضور
                                                    </span>
                                                    <span className="text-xs font-bold text-text/40">#{session['رقم الدعوى']}</span>
                                                </div>
                                                
                                                <h4 className="text-xl font-black text-dark group-hover:text-primary transition-colors">
                                                    {session['المحكمة']} - {session['الدائرة']}
                                                </h4>

                                                <div className="flex flex-wrap gap-4 text-sm font-bold text-text/70">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-primary" />
                                                        {session['التاريخ']}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4 text-primary" />
                                                        {session['وقت الموعد']} {session['ص- م']}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4 text-primary" />
                                                        {session['التكليف']}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:text-left">
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-light rounded-xl text-dark font-bold text-sm">
                                                    <DocumentTextIcon className="w-4 h-4 text-primary" />
                                                    {session['محضر الجلسة'] ? 'المحضر مسجل' : 'المحضر غير مسجل'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Minutes Section */}
                                        <div className="mt-8 p-6 bg-light/50 rounded-2xl border border-border/50">
                                            <div className="flex items-center gap-2 mb-3">
                                                <DocumentTextIcon className="w-4 h-4 text-primary" />
                                                <span className="text-xs font-black text-dark uppercase tracking-wider">محضر الجلسة</span>
                                            </div>
                                            <p className="text-dark/80 font-medium leading-relaxed">
                                                {session['محضر الجلسة'] || 'لا يوجد محضر مسجل لهذه الجلسة حتى الآن.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Remove duplicated print logic at the end */}
        </div>
    );
};

export default AttendanceReport;

