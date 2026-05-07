import React, { useMemo, useState } from 'react';
import type { CaseSession } from '../types';
import StatCard from './StatCard';
import { CheckCircleIcon, DocumentTextIcon, CalendarIcon, ClockIcon, UserIcon, ArrowRightIcon, ChevronDownIcon, PrinterIcon, PlusIcon } from './icons';

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

        // New stats based on user image
        const totalRecords = sessions.length;
        
        // Count unique violations (رقم المخالفة)
        const uniqueViolations = new Set(
            sessions
                .map(s => s['رقم المخالفة']?.toString().trim())
                .filter(v => v !== undefined && v !== null && v !== '')
        ).size;
        
        // Count entries with a session number (عدد الجلسات)
        // If the user expects 801 (total records), we should perhaps count all rows that aren't completely empty
        const sessionsWithNumber = sessions.filter(s => 
            (s['رقم الجلسة'] && s['رقم الجلسة'].toString().trim() !== '') || 
            (s['رقم الدعوى'] && s['رقم الدعوى'].toString().trim() !== '')
        ).length;

        // Count unique cases (رقم الدعوى)
        const uniqueCases = new Set(
            sessions
                .map(s => s['رقم الدعوى']?.toString().trim())
                .filter(v => v !== undefined && v !== null && v !== '')
        ).size;

        // Sum of violation values (قيمة المخالفة) - unique by violation number
        // We take the MAX value found for each violation number in case it was updated in a later session
        const uniqueViolationEntries = new Map<string, number>();
        sessions.forEach(s => {
            const vId = s['رقم المخالفة']?.toString().trim();
            if (vId && vId !== '') {
                // Remove spaces, commas and currency symbols for parsing
                const valStr = s['قيمة المخالفة']?.toString().replace(/[^\d.]/g, '') || '0';
                const val = parseFloat(valStr);
                const currentMax = uniqueViolationEntries.get(vId) || 0;
                
                if (!isNaN(val) && val > currentMax) {
                    uniqueViolationEntries.set(vId, val);
                } else if (!uniqueViolationEntries.has(vId)) {
                    uniqueViolationEntries.set(vId, isNaN(val) ? 0 : val);
                }
            }
        });
        const totalViolationValue = Array.from(uniqueViolationEntries.values()).reduce((a, b) => a + b, 0);

        // Violations without value (مخالفات بدون قيمة)
        const zeroValueViolationIds = Array.from(uniqueViolationEntries.entries())
            .filter(([_, v]) => v === 0)
            .map(([id, _]) => id);
        const violationsWithoutValue = zeroValueViolationIds.length;

        // Sum of annulled decision values (قيمة إلغاء القرار)
        const cancelledUniqueViolations = new Map<string, number>();
        cancelledDecisionSessions.forEach(s => {
            const vId = s['رقم المخالفة']?.toString().trim();
            if (vId) {
                const valStr = s['قيمة المخالفة']?.toString().replace(/,/g, '') || '0';
                const val = parseFloat(valStr);
                const currentMax = cancelledUniqueViolations.get(vId) || 0;
                if (!isNaN(val) && val > currentMax) {
                    cancelledUniqueViolations.set(vId, val);
                } else if (!cancelledUniqueViolations.has(vId)) {
                    cancelledUniqueViolations.set(vId, isNaN(val) ? 0 : val);
                }
            }
        });
        const totalCancelledValue = Array.from(cancelledUniqueViolations.values()).reduce((a, b) => a + b, 0);
        
        return { 
            totalAttended, 
            withMinutes, 
            withoutMinutes, 
            cancelledDecisionCount, 
            cancelledDecisionSessions,
            totalRecords,
            uniqueViolations,
            uniqueCases,
            totalViolationValue,
            violationsWithoutValue,
            zeroValueViolationIds,
            sessionsWithNumber,
            cancelledUniqueViolationCount: cancelledUniqueViolations.size,
            totalCancelledValue
        };
    }, [attendedSessions, sessions]);

    const [showZeroValuePopover, setShowZeroValuePopover] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(val);
    };

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full overflow-x-hidden">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                        <CheckCircleIcon className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-dark tracking-tight">تقرير حضور الجلسات</h2>
                        <p className="text-dark/60 font-medium">استعراض الجلسات التي تم حضورها ومحاضرها المسجلة</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-dark transition-all"
                    >
                        <DocumentTextIcon className="w-5 h-5" />
                        تصدير PDF
                    </button>
                    {onSessionClick && (
                        <button 
                            onClick={() => onSessionClick({})}
                            className="bg-dark text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-dark/10"
                        >
                            <PlusIcon className="w-5 h-5" />
                            إضافة جلسة
                        </button>
                    )}
                </div>
            </div>

            {/* Visual Stats Cards Wrapper - Matching User Image Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-0 rounded-[1.5rem] overflow-hidden border border-border shadow-md print:hidden rtl">
                {/* 1. عدد المخالفات */}
                <CompactStatCard 
                    title="عدد المخالفات" 
                    value={stats.uniqueViolations} 
                    subtitle="بدون تكرار" 
                    theme="blue"
                />
                {/* 2. عدد الدعاوى */}
                <CompactStatCard 
                    title="عدد الدعاوى" 
                    value={stats.uniqueCases} 
                    subtitle="بدون تكرار" 
                    theme="orange"
                />
                {/* 3. عدد الجلسات */}
                <CompactStatCard 
                    title="عدد الجلسات" 
                    value={stats.sessionsWithNumber} 
                    subtitle="رقم الجلسة" 
                    theme="green"
                />
                {/* 4. عدد الحضور */}
                <CompactStatCard 
                    title="عدد الحضور" 
                    value={stats.totalAttended} 
                    subtitle="حضرت" 
                    theme="purple"
                />
                {/* 5. توثيق الأحكام الصادرة بالإلغاء */}
                <CompactStatCard 
                    title="توثيق الأحكام الصادرة بالإلغاء" 
                    value={
                        <div className="flex items-baseline gap-1">
                            <span>{stats.cancelledDecisionCount}</span>
                            <span className="text-sm font-bold opacity-70">({formatCurrency(stats.totalCancelledValue)} ر.س)</span>
                        </div>
                    } 
                    subtitle="إجمالي القرارات الملغاة" 
                    theme="green"
                />
                {/* 6. قيمة المخالفات */}
                <CompactStatCard 
                    title="قيمة المخالفات (غير مكررة)" 
                    value={`${formatCurrency(stats.totalViolationValue)} ر.س`} 
                    subtitle={`مجموع ${stats.uniqueViolations} مخالفة فريدة`} 
                    theme="darkBlue"
                />
                {/* 7. مخالفات بدون قيمة */}
                <CompactStatCard 
                    title="مخالفات بدون قيمة" 
                    value={stats.violationsWithoutValue} 
                    subtitle={`من إجمالي ${stats.uniqueViolations} مخالفة`} 
                    theme="brown"
                    onClick={() => stats.violationsWithoutValue > 0 && setShowZeroValuePopover(true)}
                />
                {/* 8. قيمة إلغاء القرار */}
                <CompactStatCard 
                    title="قيمة إلغاء القرار" 
                    value={`${formatCurrency(stats.totalCancelledValue)} ر.س`} 
                    subtitle={`${stats.cancelledUniqueViolationCount} مخالفة فريدة`} 
                    theme="darkGreen"
                />
            </div>

            {/* Popover for Violations without value */}
            {showZeroValuePopover && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#7f3f0d] p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg">مخالفات بدون قيمة</h3>
                                    <p className="text-white/70 text-xs font-bold">قائمة أرقام المخالفات التي لم يسجل لها قيمة</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowZeroValuePopover(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowRightIcon className="w-5 h-5 rotate-180" />
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                {stats.zeroValueViolationIds.map((id, index) => (
                                    <div 
                                        key={id} 
                                        className="flex items-center justify-between p-4 bg-[#f2ece7] rounded-xl border border-[#7f3f0d]/10 hover:border-[#7f3f0d]/30 transition-all font-bold group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-[10px] text-[#7f3f0d] shadow-sm">
                                                {index + 1}
                                            </span>
                                            <span className="text-dark">رقم المخالفة:</span>
                                            <span className="text-[#7f3f0d] font-black">{id}</span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] bg-white/50 px-2 py-1 rounded-md text-[#7f3f0d]">عرض التفاصيل</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-border flex justify-end">
                            <button 
                                onClick={() => setShowZeroValuePopover(false)}
                                className="px-6 py-2 bg-[#7f3f0d] text-white rounded-xl font-black text-sm hover:opacity-90 transition-opacity"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setShowZeroValuePopover(false)} />
                </div>
            )}

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
                                    <th className="border border-border p-4 text-sm font-black text-dark">التصنيف</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">قيمة المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">محضر الجلسة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendedSessions.map((session) => (
                                    <tr key={session.id} className="print:break-inside-avoid">
                                        <td className="border border-border p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['رقم المخالفة'] || '-'}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['التصنيف'] || '-'}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['قيمة المخالفة'] || '-'}</td>
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
                                <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">العدد الإجمالي والقيمة</p>
                                <div className="flex items-baseline gap-3 justify-end">
                                    <p className="text-5xl font-black text-green-900">{stats.cancelledDecisionCount}</p>
                                    <p className="text-2xl font-bold text-green-700">({formatCurrency(stats.totalCancelledValue)} ر.س)</p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-dark mb-4 border-r-4 border-green-600 pr-4">جدول صدور إلغاء القرار</h2>
                        <table className="w-full border-collapse border border-border text-right mb-12">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم الجلسة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المدعي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">التصنيف</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">قيمة المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المحكمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.cancelledDecisionSessions.map((session) => (
                                    <tr key={session.id} className="print:break-inside-avoid">
                                        <td className="border border-border p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['رقم المخالفة'] || '-'}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['التصنيف'] || '-'}</td>
                                        <td className="border border-border p-4 text-sm font-bold text-dark">{session['قيمة المخالفة'] || '-'}</td>
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
                    title="حكم بإلغاء القرار (العدد والقيمة)" 
                    value={`${stats.cancelledDecisionCount} (${formatCurrency(stats.totalCancelledValue)} ر.س)`} 
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
                        جدول ملخص حضور الجلسات
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
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">التصنيف</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">قيمة المخالفة</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">محضر الجلسة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendedSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-text/50 font-bold">لا توجد بيانات للعرض</td>
                                    </tr>
                                ) : (
                                    attendedSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-light/50 transition-colors border-b border-border last:border-0">
                                            <td className="p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['رقم المخالفة'] || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['التصنيف'] || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['قيمة المخالفة'] || '-'}</td>
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
                <div className="w-full border-b border-border bg-green-50 flex items-center justify-between p-2">
                    <button 
                        onClick={() => setIsCancelledOpen(!isCancelledOpen)}
                        className="flex-1 p-4 flex items-center justify-between hover:bg-green-100/30 transition-colors rounded-2xl text-right"
                    >
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                توثيق الأحكام الصادرة بالإلغاء
                            </h3>
                            <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-black rounded-md">جديد</span>
                        </div>
                        <div className="p-2 bg-green-100 rounded-xl">
                            <ChevronDownIcon className={`w-6 h-6 text-green-700/60 transition-transform duration-300 ${isCancelledOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                    
                    <div className="px-4 border-r border-green-200">
                        <button 
                            onClick={handlePrintAnnulment}
                            className="p-3 bg-white text-green-700 rounded-xl border border-green-200 hover:bg-green-100 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            title="تصدير الأحكام فقط"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            <span className="text-xs font-bold hidden md:inline">تصدير الأحكام</span>
                        </button>
                    </div>
                </div>
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
                                <p className="text-[10px] font-black text-green-600 uppercase mb-1">العدد والقيمة</p>
                                <div className="flex items-baseline gap-2 justify-end">
                                    <p className="text-3xl font-black text-green-900">{stats.cancelledDecisionCount}</p>
                                    <p className="text-lg font-bold text-green-700">({formatCurrency(stats.totalCancelledValue)} ر.س)</p>
                                </div>
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
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">التصنيف</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">قيمة المخالفة</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">المحكمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.cancelledDecisionSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-text/50 font-bold">لا توجد قرارات ملغاة حالياً</td>
                                    </tr>
                                ) : (
                                    stats.cancelledDecisionSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-green-50/30 transition-colors border-b border-border last:border-0">
                                            <td className="p-4 text-sm font-bold text-dark">#{session['رقم الدعوى']}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['رقم المخالفة'] || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-dark">{session['المدعي']}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['التصنيف'] || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-text/70">{session['قيمة المخالفة'] || '-'}</td>
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

interface CompactStatCardProps {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    theme: 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'darkBlue' | 'brown' | 'darkGreen';
    onClick?: () => void;
}

const CompactStatCard: React.FC<CompactStatCardProps> = ({ title, value, subtitle, theme, onClick }) => {
    const themes = {
        blue: { header: 'bg-[#2979bd]', body: 'bg-[#e2edf6]', text: 'text-[#2979bd]' },
        orange: { header: 'bg-[#fd812e]', body: 'bg-[#fef0e6]', text: 'text-[#fd812e]' },
        green: { header: 'bg-[#73b544]', body: 'bg-[#f1f8ec]', text: 'text-[#73b544]' },
        purple: { header: 'bg-[#8934a3]', body: 'bg-[#f3eaf6]', text: 'text-[#8934a3]' },
        red: { header: 'bg-[#c50000]', body: 'bg-[#f9e5e5]', text: 'text-[#c50000]' },
        darkBlue: { header: 'bg-[#1b3a6d]', body: 'bg-[#e8ebf0]', text: 'text-[#1b3a6d]' },
        brown: { header: 'bg-[#7f3f0d]', body: 'bg-[#f2ece7]', text: 'text-[#7f3f0d]' },
        darkGreen: { header: 'bg-[#3b5926]', body: 'bg-[#ebf0e9]', text: 'text-[#3b5926]' },
    };

    const colors = themes[theme];

    return (
        <div 
            className={`flex flex-col text-center border-l border-white/20 last:border-l-0 ${onClick ? 'cursor-pointer group transition-transform active:scale-95' : ''}`}
            onClick={onClick}
        >
            <div className={`${colors.header} p-2 flex items-center justify-center min-h-[50px] relative overflow-hidden`}>
                <h4 className="text-xs font-black text-white leading-tight z-10">{title}</h4>
                {onClick && (
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                )}
            </div>
            <div className={`${colors.body} p-4 flex flex-col items-center justify-center min-h-[100px] gap-1 relative overflow-hidden`}>
                <span className={`${colors.text} text-3xl font-black tracking-tighter z-10`}>{value}</span>
                <span className="text-[10px] font-bold text-text/50 z-10">{subtitle}</span>
                {onClick && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
                         <PlusIcon className={`w-3 h-3 ${colors.text}`} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceReport;

