import React, { useMemo, useState } from 'react';
import type { CaseSession } from '../types';
import StatCard from './StatCard';
import { CheckCircleIcon, DocumentTextIcon, CalendarIcon, ClockIcon, UserIcon, ArrowRightIcon, ChevronDownIcon, PrinterIcon, PlusIcon, TableCellsIcon } from './icons';
import { utils, writeFile } from 'xlsx';

interface AttendanceReportProps {
    sessions: CaseSession[];
    onSessionClick?: (session: CaseSession) => void;
    title?: string;
    subtitle?: string;
    caseTypeFilter?: string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ 
    sessions, 
    onSessionClick,
    title = "تقرير حضور الجلسات",
    subtitle = "استعراض الجلسات التي تم حضورها ومحاضرها المسجلة",
    caseTypeFilter
}) => {
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isCancelledOpen, setIsCancelledOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [printMode, setPrintMode] = useState<'all' | 'annulment' | 'dashboard'>('all');

    const relevantSessions = useMemo(() => {
        if (!caseTypeFilter) return sessions;
        const target = caseTypeFilter.trim().toLowerCase();
        return sessions.filter(s => {
            const ct = (s['نوع الدعوى'] || '').toString().trim().toLowerCase();
            return ct.includes(target);
        });
    }, [sessions, caseTypeFilter]);

    const attendedSessions = useMemo(() => {
        return relevantSessions.filter(s => s['حضور الجلسة'] === 'حضرت');
    }, [relevantSessions]);

    const normalizeNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        if (val === undefined || val === null || val === '') return 0;
        
        let s = val.toString().trim();
        
        // 1. Replace Arabic-Indic digits
        const indicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        for (let i = 0; i < 10; i++) {
            s = s.replace(new RegExp(indicDigits[i], 'g'), i.toString());
        }

        // 2. Remove standard spacing and currency symbols
        s = s.replace(/\s|ر\.س|SAR/g, '');

        // 3. Handle decimal points. Often in these reports, the last dot or comma 
        // with 1-2 digits after it is the decimal.
        const decimalMatch = s.match(/[.,](\d{1,2})$/);
        let decimal = "";
        let main = s;
        if (decimalMatch) {
            decimal = decimalMatch[1];
            // Remove the decimal part from main string to clean separators
            main = s.substring(0, s.length - decimalMatch[0].length);
        }
        
        // 4. Remove all remaining non-digits (thousands separators like dots or commas)
        const cleanMain = main.replace(/\D/g, '');
        
        if (cleanMain === '' && decimal === '') return 0;
        
        const cleanVal = decimal ? `${cleanMain}.${decimal}` : cleanMain;
        const parsed = parseFloat(cleanVal);
        return isNaN(parsed) ? 0 : parsed;
    };

    const stats = useMemo(() => {
        const attendedSessionsRaw = relevantSessions.filter(s => {
            const status = s['حضور الجلسة']?.toString().trim();
            return status === 'حضرت' || status === 'حضر' || status === 'تم الحضور';
        });
        const totalAttended = attendedSessionsRaw.length;
        
        const withMinutes = attendedSessionsRaw.filter(s => s['محضر الجلسة'] && s['محضر الجلسة'].trim() !== '').length;
        const withoutMinutes = totalAttended - withMinutes;
        
        // Detailed stats for each case status based on Unified Case Number (رقم الدعوى الموحد)
        const getStatusStats = (statusNames: string[]) => {
            const list = relevantSessions.filter(s => {
                const sStatus = s['حالة_الدعوى']?.toString().trim() || '';
                return statusNames.some(name => sStatus === name || sStatus.includes(name));
            });
            
            const rows = list.length;

            // 1. Unique Unified Cases Map
            const uniqueCasesMap = new Map<string, CaseSession[]>();
            list.forEach(s => {
                const caseKey = (s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'])?.toString().trim();
                if (caseKey && caseKey !== '') {
                    if (!uniqueCasesMap.has(caseKey)) uniqueCasesMap.set(caseKey, []);
                    uniqueCasesMap.get(caseKey)!.push(s);
                }
            });
            const uniqueCasesCount = uniqueCasesMap.size;

            // 2. Unique Violations & Value (highest value per unique violation / unique case)
            const uniqueViolationsMap = new Map<string, number>();
            list.forEach(s => {
                const vId = s['رقم المخالفة']?.toString().trim();
                const caseKey = (s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'])?.toString().trim();
                const key = (vId && vId !== '') ? vId : (caseKey && caseKey !== '' ? `case_${caseKey}` : `temp_${s.id}`);
                const val = normalizeNumber(s['قيمة المخالفة']);
                const currentMax = uniqueViolationsMap.get(key) || 0;
                if (val > currentMax || !uniqueViolationsMap.has(key)) {
                    uniqueViolationsMap.set(key, val);
                }
            });
            
            const uniqueViolationsCount = Array.from(new Set(
                list.map(s => s['رقم المخالفة']?.toString().trim()).filter(v => v !== undefined && v !== null && v !== '')
            )).length;

            const totalVal = Array.from(uniqueViolationsMap.values()).reduce((a, b) => a + b, 0);
            
            return { 
                rows, 
                uniqueCasesCount, 
                uniqueViolationsCount, 
                uniqueCount: uniqueCasesCount > 0 ? uniqueCasesCount : uniqueViolationsCount, 
                totalVal, 
                list 
            };
        };

        const annulment = getStatusStats(['إلغاء القرار', 'تنفيذ حكم إلغاء القرار', 'إلغاء القرار(حكم الاستئناف)']);
        const adjournment = getStatusStats(['تأجيل الجلسة', 'تأجيل']);
        const nonAcceptance = getStatusStats(['عدم القبول', 'حكم بعدم القبول']);
        const refusal = getStatusStats(['رفض الدعوى', 'رفض']);
        
        // For the table display, we still need unique cases for the annulment section
        const uniqueCancelledMap = new Map<string, CaseSession>();
        annulment.list.forEach(s => {
            const caseId = (s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'])?.toString().trim();
            const vId = s['رقم المخالفة']?.toString().trim();
            const key = caseId && caseId !== '' ? caseId : (vId && vId !== '' ? `v_${vId}` : `temp_${Math.random()}`);
            if (!uniqueCancelledMap.has(key)) {
                uniqueCancelledMap.set(key, s);
            }
        });

        // Track duplicate violations specifically in the annulment subset for the popover
        const violationCountsInAnnulment = new Map<string, number>();
        annulment.list.forEach(s => {
            const vId = s['رقم المخالفة']?.toString().trim();
            if (vId && vId !== '') {
                violationCountsInAnnulment.set(vId, (violationCountsInAnnulment.get(vId) || 0) + 1);
            }
        });

        const cancelledDecisionSessions = Array.from(uniqueCancelledMap.values());
        const duplicateViolationIdsInAnnulment = Array.from(violationCountsInAnnulment.entries())
            .filter(([_, count]) => count > 1)
            .map(([id, _]) => id);

        // Count unique violations (رقم المخالفة) in the entire dataset
        const uniqueViolationsList = Array.from(new Set(
            relevantSessions
                .map(s => s['رقم المخالفة']?.toString().trim())
                .filter(v => v !== undefined && v !== null && v !== '')
        ));
        const uniqueViolations = uniqueViolationsList.length;
        
        // Count entries that are not entirely empty (aligning with total records 780)
        const sessionsWithNumber = relevantSessions.filter(s => 
            (s['رقم_الدعوى_الموحد'] && s['رقم_الدعوى_الموحد'].toString().trim() !== '') ||
            (s['رقم الدعوى'] && s['رقم الدعوى'].toString().trim() !== '') ||
            (s['تاريخ الموعد'] && s['تاريخ الموعد'].toString().trim() !== '') ||
            (s['رقم المخالفة'] && s['رقم المخالفة'].toString().trim() !== '')
        ).length;

        // Count unique cases (رقم الدعوى الموحد بدون تكرار) in the entire dataset
        const uniqueCases = new Set(
            relevantSessions
                .map(s => (s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'])?.toString().trim())
                .filter(v => v !== undefined && v !== null && v !== '')
        ).size;

        // Sum of ALL violation values (unique by violation number) across entire dataset
        // Rule: For each unique violation number, take the HIGHEST value encountered.
        // This ensures updates or multiple sessions don't dilute the reported violation amount.
        const uniqueViolationEntries = new Map<string, number>();
        relevantSessions.forEach(s => {
            const vId = s['رقم المخالفة']?.toString().trim();
            if (vId && vId !== '') {
                const val = normalizeNumber(s['قيمة المخالفة']);
                const currentMax = uniqueViolationEntries.get(vId) || 0;
                if (val > currentMax || !uniqueViolationEntries.has(vId)) {
                    uniqueViolationEntries.set(vId, val);
                }
            }
        });
        const totalViolationValue = Array.from(uniqueViolationEntries.values()).reduce((a, b) => a + b, 0);

        // Violations without value (مخالفات بدون قيمة)
        const zeroValueViolationIds = Array.from(uniqueViolationEntries.entries())
            .filter(([_, v]) => v === 0)
            .map(([id, _]) => id);
        const violationsWithoutValue = zeroValueViolationIds.length;
        
        return { 
            totalAttended, 
            withMinutes, 
            withoutMinutes, 
            cancelledDecisionCount: cancelledDecisionSessions.length, // unique count of decisions without postponed duplicates
            cancelledDecisionSessions,
            uniqueViolations, // should be 337
            uniqueCases, // should be 396
            totalViolationValue, // should be 1,059,500
            violationsWithoutValue, // should be 2
            zeroValueViolationIds,
            sessionsWithNumber, // should be 780
            cancelledUniqueViolationCount: annulment.uniqueCount, // 95 unique violations
            totalCancelledValue: annulment.totalVal, // 295,000 value
            annulment,
            adjournment,
            nonAcceptance,
            refusal,
            duplicateViolationIdsInAnnulment
        };
    }, [relevantSessions]);

    const [showZeroValuePopover, setShowZeroValuePopover] = useState(false);
    const [showDuplicatesPopover, setShowDuplicatesPopover] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(val);
    };

    const handleExportPDF = () => {
        setPrintMode('all');
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleExportDashboard = () => {
        setPrintMode('dashboard');
        setTimeout(() => {
            window.print();
        }, 100);
    };
    
    const handleExportExcel = () => {
        // 1. Dashboard Stats Sheet
        const dashboardStats = [
            { 'المؤشر': 'عدد المخالفات', 'القيمة': stats.uniqueViolations, 'ملاحظات': 'بدون تكرار' },
            { 'المؤشر': 'عدد الدعاوى', 'القيمة': stats.uniqueCases, 'ملاحظات': 'بدون تكرار' },
            { 'المؤشر': 'عدد الجلسات', 'القيمة': stats.sessionsWithNumber, 'ملاحظات': 'رقم الجلسة' },
            { 'المؤشر': 'عدد الحضور', 'القيمة': stats.totalAttended, 'ملاحظات': 'حضرت' },
            { 'المؤشر': 'عدد أحكام الإلغاء', 'القيمة': stats.cancelledDecisionCount, 'ملاحظات': 'توثيق الأحكام الصادرة بالإلغاء' },
            { 'المؤشر': 'إجمالي قيمة المخالفات', 'القيمة': stats.totalViolationValue, 'ملاحظات': 'ر.س' },
            { 'المؤشر': 'إجمالي قيمة الإلغاء', 'القيمة': stats.totalCancelledValue, 'ملاحظات': 'ر.س' },
            { 'المؤشر': 'مخالفات بدون قيمة', 'القيمة': stats.violationsWithoutValue, 'ملاحظات': 'لم يسجل لها قيمة' },
        ];

        // 2. Status Distribution Sheet
        const statusDistributionData = [
            {
                'حالة الدعوى': 'تأجيل الجلسة',
                'الدعاوى الفريدة (رقم الدعوى الموحد)': stats.adjournment.uniqueCasesCount,
                'المخالفات الفريدة': stats.adjournment.uniqueViolationsCount,
                'إجمالي سجلات الجلسات': stats.adjournment.rows,
                'إجمالي القيمة (ر.س)': stats.adjournment.totalVal
            },
            {
                'حالة الدعوى': 'إلغاء القرار',
                'الدعاوى الفريدة (رقم الدعوى الموحد)': stats.annulment.uniqueCasesCount,
                'المخالفات الفريدة': stats.annulment.uniqueViolationsCount,
                'إجمالي سجلات الجلسات': stats.annulment.rows,
                'إجمالي القيمة (ر.س)': stats.annulment.totalVal
            },
            {
                'حالة الدعوى': 'عدم القبول',
                'الدعاوى الفريدة (رقم الدعوى الموحد)': stats.nonAcceptance.uniqueCasesCount,
                'المخالفات الفريدة': stats.nonAcceptance.uniqueViolationsCount,
                'إجمالي سجلات الجلسات': stats.nonAcceptance.rows,
                'إجمالي القيمة (ر.س)': stats.nonAcceptance.totalVal
            },
            {
                'حالة الدعوى': 'رفض الدعوى',
                'الدعاوى الفريدة (رقم الدعوى الموحد)': stats.refusal.uniqueCasesCount,
                'المخالفات الفريدة': stats.refusal.uniqueViolationsCount,
                'إجمالي سجلات الجلسات': stats.refusal.rows,
                'إجمالي القيمة (ر.س)': stats.refusal.totalVal
            }
        ];

        // 3. Annulment Decisions Sheet
        const annulmentData = stats.cancelledDecisionSessions.map(session => ({
            'رقم الدعوى الموحد': session['رقم_الدعوى_الموحد'] || session['رقم الدعوى'] || '',
            'درجة التقاضي': session['درجة_التقاضي'] || '',
            'رقم الدعوى الفرعي': session['رقم الدعوى'] || '',
            'رقم المخالفة': session['رقم المخالفة'] || '',
            'المدعي': session['المدعي'],
            'التصنيف': session['التصنيف'] || '',
            'قيمة المخالفة': session['قيمة المخالفة'] || '',
            'المحكمة': session['المحكمة'],
            'الدائرة': session['الدائرة'],
            'التاريخ': session['التاريخ'],
        }));

        // Create workbook and add sheets
        const wb = utils.book_new();
        
        const wsStats = utils.json_to_sheet(dashboardStats);
        utils.book_append_sheet(wb, wsStats, "ملخص الإحصائيات");

        const wsDist = utils.json_to_sheet(statusDistributionData);
        utils.book_append_sheet(wb, wsDist, "توزيع حالات الدعاوى");

        if (annulmentData.length > 0) {
            const wsAnnulment = utils.json_to_sheet(annulmentData);
            utils.book_append_sheet(wb, wsAnnulment, "أحكام إلغاء القرار");
        }

        // Write file
        writeFile(wb, `تقرير_داش_بورد_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
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
                        <h2 className="text-3xl font-black text-dark tracking-tight">{title}</h2>
                        <p className="text-dark/60 font-medium">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-green-700 text-white rounded-2xl font-black shadow-lg shadow-green-700/10 hover:bg-green-800 transition-all"
                    >
                        <TableCellsIcon className="w-5 h-5" />
                        تصدير إكسل
                    </button>
                    <button 
                        onClick={handleExportDashboard}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-dark text-white rounded-2xl font-black shadow-lg shadow-dark/10 hover:bg-black transition-all"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        طباعة الداش بورد
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-dark transition-all"
                    >
                        <DocumentTextIcon className="w-5 h-5" />
                        تصدير PDF
                    </button>
                </div>
            </div>

            {/* Visual Stats Cards Wrapper - Matching User Image Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-0 rounded-[1.5rem] overflow-hidden border border-border shadow-md print:hidden rtl">
                {/* 1. المخالفات الفريدة */}
                <CompactStatCard 
                    title="المخالفات الفريدة" 
                    value={stats.uniqueViolations} 
                    subtitle="بدون تكرار" 
                    theme="blue"
                />
                {/* 2. الدعاوى الفريدة */}
                <CompactStatCard 
                    title="الدعاوى الفريدة" 
                    value={stats.uniqueCases} 
                    subtitle="بدون تكرار" 
                    theme="orange"
                />
                {/* 3. إجمالي صفوف الجلسات */}
                <CompactStatCard 
                    title="إجمالي صفوف الجلسات" 
                    value={stats.sessionsWithNumber} 
                    subtitle="عدد السجلات" 
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
                    subtitle="إجمالي القرارات الملغاة (فريدة)" 
                    theme="green"
                />
                {/* 6. قيمة المخالفات */}
                <CompactStatCard 
                    title="إجمالي قيمة المخالفات (فريدة)" 
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

            {/* Status Distribution Table - Rebuilt with Unified Case Numbers */}
            <div className="bg-white rounded-[2rem] border border-border shadow-md overflow-hidden print:hidden">
                <div className="p-6 border-b border-border bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <TableCellsIcon className="w-6 h-6 text-primary" />
                        <div>
                            <h3 className="text-xl font-black text-dark tracking-tight">تفاصيل حالة الدعوى (توزيع الحالات)</h3>
                            <p className="text-xs font-bold text-dark/60 mt-0.5">محسوبة بناءً على رقم الدعوى الموحد بدون تكرار</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg border border-primary/20">
                            إجمالي الدعاوى الفريدة: {stats.uniqueCases}
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-primary/5 text-primary">
                                <th className="p-4 font-black border-b border-border">حالة الدعوى</th>
                                <th className="p-4 font-black border-b border-border text-center">الدعاوى الفريدة (رقم الدعوى الموحد)</th>
                                <th className="p-4 font-black border-b border-border text-center">المخالفات الفريدة</th>
                                <th className="p-4 font-black border-b border-border text-center">إجمالي سجلات الجلسات</th>
                                <th className="p-4 font-black border-b border-border text-left">إجمالي القيمة (ر.س)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                { label: 'تأجيل الجلسة', stats: stats.adjournment, color: 'text-orange-600', bg: 'bg-orange-50' },
                                { label: 'إلغاء القرار', stats: stats.annulment, color: 'text-green-600', bg: 'bg-green-50' },
                                { label: 'عدم القبول', stats: stats.nonAcceptance, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'رفض الدعوى', stats: stats.refusal, color: 'text-red-600', bg: 'bg-red-50' }
                            ].map((row) => (
                                <tr key={row.label} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 font-black text-dark">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${row.bg.replace('bg-', 'bg-opacity-100 bg-')}`} />
                                            <span className="text-base">{row.label}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-black text-dark">
                                        <span className="inline-block px-3 py-1 rounded-full bg-light border border-border text-primary font-black">
                                            {row.stats.uniqueCasesCount}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-bold text-dark/80">
                                        {row.stats.uniqueViolationsCount}
                                    </td>
                                    <td className="p-4 text-center font-bold text-dark/60">
                                        {row.stats.rows}
                                    </td>
                                    <td className={`p-4 text-left font-black text-base ${row.color}`}>
                                        {formatCurrency(row.stats.totalVal)} ر.س
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50/80 font-black border-t-2 border-border text-dark">
                                <td className="p-4 font-black text-primary">المجموع الكلي</td>
                                <td className="p-4 text-center font-black text-primary">
                                    {stats.adjournment.uniqueCasesCount + stats.annulment.uniqueCasesCount + stats.nonAcceptance.uniqueCasesCount + stats.refusal.uniqueCasesCount}
                                </td>
                                <td className="p-4 text-center font-black text-dark">
                                    {stats.uniqueViolations}
                                </td>
                                <td className="p-4 text-center font-black text-dark/70">
                                    {stats.adjournment.rows + stats.annulment.rows + stats.nonAcceptance.rows + stats.refusal.rows}
                                </td>
                                <td className="p-4 text-left font-black text-primary">
                                    {formatCurrency(stats.adjournment.totalVal + stats.annulment.totalVal + stats.nonAcceptance.totalVal + stats.refusal.totalVal)} ر.س
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
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

            {/* Popover for Duplicate Violations in Annulments */}
            {showDuplicatesPopover && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-red-700 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg">مخالفات مكررة</h3>
                                    <p className="text-white/70 text-xs font-bold">أرقام المخالفات التي ظهرت في أكثر من دعوى ملغاة</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowDuplicatesPopover(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowRightIcon className="w-5 h-5 rotate-180" />
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 text-red-800 rounded-xl text-sm font-bold border border-red-100 leading-relaxed">
                                    ملاحظة: تم استبعاد التكرارات من الإحصائيات (العدد والقيمة) لضمان دقة التقرير، حيث تم احتساب كل مخالفة مكررة مرة واحدة فقط.
                                </div>
                                <div className="space-y-2">
                                    {stats.duplicateViolationIdsInAnnulment.map((id, index) => (
                                        <div 
                                            key={id} 
                                            className="flex items-center justify-between p-4 bg-red-50/30 rounded-xl border border-red-700/10 transition-all font-bold group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-[10px] text-red-700 shadow-sm border border-red-100">
                                                    {index + 1}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-dark/60 text-[10px] uppercase">رقم المخالفة</span>
                                                    <span className="text-red-700 font-black">{id}</span>
                                                </div>
                                            </div>
                                            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px]">
                                                مكررة
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-border flex justify-end">
                            <button 
                                onClick={() => setShowDuplicatesPopover(false)}
                                className="px-6 py-2 bg-red-700 text-white rounded-xl font-black text-sm hover:opacity-90 transition-opacity"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setShowDuplicatesPopover(false)} />
                </div>
            )}
            <div className="hidden print:block">
                <img 
                    src="https://russeellcloud.k.frappe.cloud/files/header.jpg" 
                    alt="Official Header" 
                    className="w-full h-auto"
                    referrerPolicy="no-referrer"
                />
                
                {printMode === 'dashboard' ? (
                    <div className="mt-8 space-y-12">
                        <div className="text-center space-y-2 border-b-2 border-primary pb-6">
                            <h1 className="text-3xl font-black text-dark">لوحة المعلومات والإحصائيات</h1>
                            <p className="text-primary font-bold">ملخص عام لجميع المؤشرات والبيانات</p>
                        </div>
                        
                        {/* Replicating the compact cards for print */}
                        <div className="grid grid-cols-2 gap-4 rtl">
                            <PrintStatBox title="عدد المخالفات" value={stats.uniqueViolations} subtitle="بدون تكرار" color="#2979bd" />
                            <PrintStatBox title="عدد الدعاوى" value={stats.uniqueCases} subtitle="بدون تكرار" color="#fd812e" />
                            <PrintStatBox title="عدد الجلسات" value={stats.sessionsWithNumber} subtitle="رقم الجلسة" color="#73b544" />
                            <PrintStatBox title="عدد الحضور" value={stats.totalAttended} subtitle="حضرت" color="#8934a3" />
                            <PrintStatBox 
                                title="توثيق الأحكام الصادرة بالإلغاء" 
                                value={`${stats.cancelledDecisionCount} (${formatCurrency(stats.totalCancelledValue)} ر.س)`} 
                                subtitle="إجمالي القرارات الملغاة (فريدة)" 
                                color="#c50000" 
                            />
                            <PrintStatBox 
                                title="قيمة المخالفات (غير مكررة)" 
                                value={`${formatCurrency(stats.totalViolationValue)} ر.س`} 
                                subtitle={`مجموع ${stats.uniqueViolations} مخالفة فريدة`} 
                                color="#1b3a6d" 
                            />
                            <PrintStatBox title="مخالفات بدون قيمة" value={stats.violationsWithoutValue} subtitle={`من إجمالي ${stats.uniqueViolations} مخالفة`} color="#7f3f0d" />
                            <PrintStatBox title="قيمة إلغاء القرار" value={`${formatCurrency(stats.totalCancelledValue)} ر.س`} subtitle={`${stats.cancelledUniqueViolationCount} مخالفة فريدة`} color="#3b5926" />
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-12">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                                <h3 className="font-black text-dark mb-4 border-r-4 border-primary pr-3">ملخص الحضور</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-bold text-text/60">إجمالي الجلسات المحضورة:</span>
                                        <span className="font-black text-primary">{stats.totalAttended}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-bold text-text/60">جلسات بمحضر مسجل:</span>
                                        <span className="font-black text-green-600">{stats.withMinutes}</span>
                                    </div>
                                    <div className="flex justify-between pb-2">
                                        <span className="font-bold text-text/60">جلسات بدون محضر:</span>
                                        <span className="font-black text-amber-600">{stats.withoutMinutes}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                                <h3 className="font-black text-dark mb-4 border-r-4 border-green-600 pr-3">ملخص الأحكام</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-bold text-text/60">عدد أحكام الإلغاء:</span>
                                        <span className="font-black text-green-700">{stats.cancelledDecisionCount}</span>
                                    </div>
                                    <div className="flex justify-between pb-2">
                                        <span className="font-bold text-text/60">إجمالي القيمة المستردة:</span>
                                        <span className="font-black text-green-700">{formatCurrency(stats.totalCancelledValue)} ر.س</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Distribution Table for Print */}
                        <div className="mt-12 break-inside-avoid shadow-sm print:shadow-none">
                            <h3 className="text-xl font-black text-dark mb-6 border-r-4 border-primary pr-3">تفاصيل حالة الدعوى (توزيع الحالات)</h3>
                            <table className="w-full text-right border-collapse border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <thead>
                                    <tr className="bg-primary/10 text-primary">
                                        <th className="p-3 border border-gray-200 font-black">حالة الدعوى</th>
                                        <th className="p-3 border border-gray-200 font-black text-center">الدعاوى الفريدة (رقم الدعوى الموحد)</th>
                                        <th className="p-3 border border-gray-200 font-black text-center">المخالفات الفريدة</th>
                                        <th className="p-3 border border-gray-200 font-black text-center">إجمالي السجلات</th>
                                        <th className="p-3 border border-gray-200 font-black text-left">إجمالي القيمة (ر.س)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'تأجيل الجلسة', stats: stats.adjournment },
                                        { label: 'إلغاء القرار', stats: stats.annulment },
                                        { label: 'عدم القبول', stats: stats.nonAcceptance },
                                        { label: 'رفض الدعوى', stats: stats.refusal }
                                    ].map((row) => (
                                        <tr key={row.label} className="border-b last:border-0 border-gray-100">
                                            <td className="p-3 border border-gray-200 font-bold bg-gray-50/50">{row.label}</td>
                                            <td className="p-3 border border-gray-200 text-center font-bold text-dark">{row.stats.uniqueCasesCount}</td>
                                            <td className="p-3 border border-gray-200 text-center font-bold text-dark/70">{row.stats.uniqueViolationsCount}</td>
                                            <td className="p-3 border border-gray-200 text-center font-bold text-dark/70">{row.stats.rows}</td>
                                            <td className="p-3 border border-gray-200 text-left font-black text-dark">{formatCurrency(row.stats.totalVal)} ر.س</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-[10px] text-gray-400 mt-4 italic font-bold">
                                * يتم احتساب الدعاوى الفريدة بناءً على رقم الدعوى الموحد بدون تكرار.
                            </p>
                        </div>
                    </div>
                ) : printMode === 'all' ? (
                    <>
                        <div className="text-center mt-6 space-y-2 border-b-2 border-primary pb-6">
                            <h1 className="text-3xl font-black text-dark">{title}</h1>
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
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم الدعوى الموحد</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark text-center">درجة التقاضي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المدعي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">التصنيف</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">قيمة المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">محضر الجلسة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendedSessions.map((session, index) => (
                                    <tr key={`${session.id}-${index}`} className="print:break-inside-avoid">
                                        <td className="border border-border p-4 text-sm font-bold text-dark">
                                            #{session['رقم_الدعوى_الموحد'] || session['رقم الدعوى'] || '-'}
                                        </td>
                                        <td className="border border-border p-4 text-sm font-bold text-center text-dark/80">
                                            {session['درجة_التقاضي'] || '-'}
                                        </td>
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
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم الدعوى الموحد</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark text-center">درجة التقاضي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">رقم المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المدعي</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">التصنيف</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">قيمة المخالفة</th>
                                    <th className="border border-border p-4 text-sm font-black text-dark">المحكمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.cancelledDecisionSessions.map((session, index) => (
                                    <tr key={`${session.id}-${index}`} className="print:break-inside-avoid">
                                        <td className="border border-border p-4 text-sm font-bold text-dark">
                                            #{session['رقم_الدعوى_الموحد'] || session['رقم الدعوى'] || '-'}
                                        </td>
                                        <td className="border border-border p-4 text-sm font-bold text-center text-dark/80">
                                            {session['درجة_التقاضي'] || '-'}
                                        </td>
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
                    تم استخراج هذا التقرير ({printMode === 'all' ? 'شامل' : printMode === 'dashboard' ? 'لوحة المعلومات' : 'أحكام إلغاء القرار فقط'}) بتاريخ {new Date().toLocaleDateString('ar-SA')}
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
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">رقم الدعوى الموحد</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border text-center">درجة التقاضي</th>
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
                                        <td colSpan={7} className="p-8 text-center text-text/50 font-bold">لا توجد بيانات للعرض</td>
                                    </tr>
                                ) : (
                                    attendedSessions.map((session, index) => (
                                        <tr key={`${session.id}-${index}`} className="hover:bg-light/50 transition-colors border-b border-border last:border-0">
                                            <td className="p-4 text-sm font-bold text-dark">
                                                <div className="flex flex-col">
                                                    <span>#{session['رقم_الدعوى_الموحد'] || session['رقم الدعوى'] || '-'}</span>
                                                    {session['رقم_الدعوى_الموحد'] && session['رقم الدعوى'] && session['رقم الدعوى'] !== session['رقم_الدعوى_الموحد'] && (
                                                        <span className="text-[10px] text-dark/50 font-normal">فرعي: #{session['رقم الدعوى']}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-center text-dark/80">
                                                {session['درجة_التقاضي'] ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                        {session['درجة_التقاضي']}
                                                    </span>
                                                ) : (
                                                    <span className="text-dark/40">-</span>
                                                )}
                                            </td>
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
                    
                    <div className="px-4 border-r border-green-200 flex items-center gap-2">
                        <button 
                            onClick={handleExportExcel}
                            className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            title="تصدير إكسل"
                        >
                            <TableCellsIcon className="w-5 h-5" />
                            <span className="text-xs font-bold hidden md:inline">تصدير إكسل</span>
                        </button>
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
                            <div className="text-left flex flex-col items-end gap-2">
                                <p className="text-[10px] font-black text-green-600 uppercase mb-1">العدد والقيمة</p>
                                <div className="flex items-baseline gap-2 justify-end">
                                    <p className="text-3xl font-black text-green-900">{stats.cancelledDecisionCount}</p>
                                    <p className="text-lg font-bold text-green-700">({formatCurrency(stats.totalCancelledValue)} ر.س)</p>
                                </div>
                                {stats.duplicateViolationIdsInAnnulment.length > 0 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowDuplicatesPopover(true); }}
                                        className="mt-1 flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-black border border-red-100 hover:bg-red-100 transition-colors animate-pulse"
                                    >
                                        <PlusIcon className="w-3 h-3" />
                                        مخالفات مكررة ({stats.duplicateViolationIdsInAnnulment.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-right">
                            <thead>
                                <tr className="bg-green-50/50">
                                    <th className="p-4 text-sm font-black text-dark border-b border-border">رقم الدعوى الموحد</th>
                                    <th className="p-4 text-sm font-black text-dark border-b border-border text-center">درجة التقاضي</th>
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
                                        <td colSpan={7} className="p-8 text-center text-text/50 font-bold">لا توجد قرارات ملغاة حالياً</td>
                                    </tr>
                                ) : (
                                    stats.cancelledDecisionSessions.map((session, index) => (
                                        <tr key={`${session.id}-${index}`} className="hover:bg-green-50/30 transition-colors border-b border-border last:border-0">
                                            <td className="p-4 text-sm font-bold text-dark">
                                                <div className="flex flex-col">
                                                    <span>#{session['رقم_الدعوى_الموحد'] || session['رقم الدعوى'] || '-'}</span>
                                                    {session['رقم_الدعوى_الموحد'] && session['رقم الدعوى'] && session['رقم الدعوى'] !== session['رقم_الدعوى_الموحد'] && (
                                                        <span className="text-[10px] text-dark/50 font-normal">فرعي: #{session['رقم الدعوى']}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-center text-dark/80">
                                                {session['درجة_التقاضي'] ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                                        {session['درجة_التقاضي']}
                                                    </span>
                                                ) : (
                                                    <span className="text-dark/40">-</span>
                                                )}
                                            </td>
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
                            {attendedSessions.map((session, index) => (
                                <div 
                                    key={`${session.id}-${index}`}
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

const PrintStatBox: React.FC<{ title: string; value: React.ReactNode; subtitle: string; color: string }> = ({ title, value, subtitle, color }) => (
    <div className="border-2 rounded-2xl overflow-hidden flex flex-col" style={{ borderColor: color }}>
        <div className="p-2 text-center text-white font-black text-xs" style={{ backgroundColor: color }}>
            {title}
        </div>
        <div className="p-4 text-center bg-gray-50 flex-1 flex flex-col justify-center gap-1">
            <div className="text-2xl font-black" style={{ color: color }}>{value}</div>
            <div className="text-[10px] font-bold text-text/50">{subtitle}</div>
        </div>
    </div>
);

export default AttendanceReport;

