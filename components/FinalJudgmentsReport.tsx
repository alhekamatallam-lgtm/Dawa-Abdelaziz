import React, { useState, useMemo } from 'react';
import type { CaseSession } from '../types';
import StatCard from './StatCard';
import { ChartBarIcon, DocumentTextIcon, CheckCircleIcon, ArrowDownTrayIcon, PrinterIcon } from './icons';
import { formatViolationDate } from '../utils/caseHelpers';
import * as XLSX from 'xlsx';

interface FinalJudgmentsReportProps {
    sessions: CaseSession[];
    onSessionClick?: (session: CaseSession) => void;
}

// Utility to parse numerical value from string or number
const parseCurrencyValue = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = val.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('ar-SA').format(val);
};

export const FinalJudgmentsReport: React.FC<FinalJudgmentsReportProps> = ({ sessions, onSessionClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJudgmentStatus, setSelectedJudgmentStatus] = useState<string>('all');
    const [selectedCourt, setSelectedCourt] = useState<string>('all');
    const [selectedPlaintiff, setSelectedPlaintiff] = useState<string>('all');
    const [selectedLitigationDegree, setSelectedLitigationDegree] = useState<string>('all');

    // 1. Group sessions by unique "رقم_الدعوى_الموحد" or "رقم الدعوى"
    // For each unique case number, pick the session with the actual judgment (non-postponed)
    const uniqueCasesMap = useMemo(() => {
        const caseNosSet = new Set<string>();
        sessions.forEach(s => {
            const key = (s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'] || '').toString().trim();
            if (key) caseNosSet.add(key);
        });

        const result: CaseSession[] = [];

        caseNosSet.forEach(caseKey => {
            const caseSessions = sessions.filter(s => 
                (s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'] || '').toString().trim() === caseKey
            );
            if (caseSessions.length === 0) return;

            // Find session with actual judgment ruling (not postponed 'تأجيل')
            const bestRulingSession = caseSessions.find(s => {
                const status = (s['حالة_الدعوى'] || '').toString().trim();
                const isPostponed = status.includes('تأجيل');
                return !isPostponed && (!!s['حكم_نهائي'] || status.includes('إلغاء') || status.includes('رفض') || status.includes('محكومة') || status.includes('قبول'));
            }) || caseSessions.find(s => !!s['حكم_نهائي']) || caseSessions.find(s => !(s['حالة_الدعوى'] || '').toString().includes('تأجيل')) || caseSessions[0];

            // Merge metadata if missing in bestRulingSession
            const violationDate = caseSessions.find(s => !!s['تاريخ المخالفة'])?.['تاريخ المخالفة'] || bestRulingSession['تاريخ المخالفة'];
            const violationVal = caseSessions.find(s => parseCurrencyValue(s['قيمة المخالفة']) > 0)?.['قيمة المخالفة'] || bestRulingSession['قيمة المخالفة'];
            const finalJudg = caseSessions.find(s => !!s['حكم_نهائي'])?.['حكم_نهائي'] || bestRulingSession['حكم_نهائي'];
            const unifiedNo = caseSessions.find(s => !!s['رقم_الدعوى_الموحد'])?.['رقم_الدعوى_الموحد'] || bestRulingSession['رقم_الدعوى_الموحد'];
            const litDegree = caseSessions.find(s => !!s['درجة_التقاضي'])?.['درجة_التقاضي'] || bestRulingSession['درجة_التقاضي'];

            result.push({
                ...bestRulingSession,
                'رقم_الدعوى_الموحد': unifiedNo,
                'درجة_التقاضي': litDegree,
                'تاريخ المخالفة': violationDate,
                'قيمة المخالفة': violationVal,
                'حكم_نهائي': finalJudg
            });
        });

        return result;
    }, [sessions]);

    // Unique list of judgment statuses present in the data
    const judgmentStatuses = useMemo(() => {
        const set = new Set<string>();
        uniqueCasesMap.forEach(s => {
            const status = (s['حكم_نهائي'] || '').toString().trim();
            if (status) set.add(status);
        });
        
        // Ensure default options exist if not present
        if (!set.has('قيد المداولة')) set.add('قيد المداولة');
        if (!set.has('حكم نهائي إلغاء القرار')) set.add('حكم نهائي إلغاء القرار');

        return Array.from(set).sort();
    }, [uniqueCasesMap]);

    // Unique Courts & Plaintiffs
    const uniqueCourts = useMemo(() => {
        const set = new Set<string>();
        uniqueCasesMap.forEach(s => {
            if (s['المحكمة']) set.add(s['المحكمة'].trim());
        });
        return Array.from(set).sort();
    }, [uniqueCasesMap]);

    const uniquePlaintiffs = useMemo(() => {
        const set = new Set<string>();
        uniqueCasesMap.forEach(s => {
            if (s['المدعي']) set.add(s['المدعي'].trim());
        });
        return Array.from(set).sort();
    }, [uniqueCasesMap]);

    const uniqueLitigationDegrees = useMemo(() => {
        const set = new Set<string>();
        uniqueCasesMap.forEach(s => {
            if (s['درجة_التقاضي']) set.add(s['درجة_التقاضي'].trim());
        });
        return Array.from(set).sort();
    }, [uniqueCasesMap]);

    // Overall Statistics (Unique Cases Basis)
    const overallStats = useMemo(() => {
        let pendingCount = 0; // قيد المداولة
        let pendingValue = 0;

        let annulmentCount = 0; // حكم نهائي إلغاء القرار
        let annulmentValue = 0;

        let otherFinalCount = 0;
        let otherFinalValue = 0;

        let totalValue = 0;

        uniqueCasesMap.forEach(s => {
            const status = (s['حكم_نهائي'] || 'قيد المداولة').toString().trim();
            const val = parseCurrencyValue(s['قيمة المخالفة']);
            totalValue += val;

            if (status === 'قيد المداولة' || !s['حكم_نهائي']) {
                pendingCount++;
                pendingValue += val;
            } else if (status.includes('إلغاء القرار')) {
                annulmentCount++;
                annulmentValue += val;
            } else {
                otherFinalCount++;
                otherFinalValue += val;
            }
        });

        return {
            totalUniqueCases: uniqueCasesMap.length,
            pendingCount,
            pendingValue,
            annulmentCount,
            annulmentValue,
            otherFinalCount,
            otherFinalValue,
            totalValue
        };
    }, [uniqueCasesMap]);

    // Filtered unique cases based on user filters
    const filteredCases = useMemo(() => {
        return uniqueCasesMap.filter(s => {
            const unifiedNoStr = (s['رقم_الدعوى_الموحد'] || '').toString().toLowerCase();
            const litDegreeStr = (s['درجة_التقاضي'] || '').toString().toLowerCase();
            const caseNoStr = (s['رقم الدعوى'] || '').toString().toLowerCase();
            const violationNoStr = (s['رقم المخالفة'] || '').toString().toLowerCase();
            const plaintiffStr = (s['المدعي'] || '').toString().toLowerCase();
            const courtStr = (s['المحكمة'] || '').toString().toLowerCase();
            const judgmentStatus = (s['حكم_نهائي'] || 'قيد المداولة').toString().trim();
            const query = searchQuery.toLowerCase().trim();

            // Search filter
            if (query) {
                const matches = unifiedNoStr.includes(query) ||
                    litDegreeStr.includes(query) ||
                    caseNoStr.includes(query) ||
                    violationNoStr.includes(query) ||
                    plaintiffStr.includes(query) ||
                    courtStr.includes(query) ||
                    judgmentStatus.toLowerCase().includes(query) ||
                    (s['تاريخ المخالفة'] || '').toString().includes(query);
                if (!matches) return false;
            }

            // Judgment Status Filter
            if (selectedJudgmentStatus !== 'all') {
                if (selectedJudgmentStatus === 'قيد المداولة') {
                    if (judgmentStatus !== 'قيد المداولة' && s['حكم_نهائي']) return false;
                } else if (judgmentStatus !== selectedJudgmentStatus) {
                    return false;
                }
            }

            // Court Filter
            if (selectedCourt !== 'all' && s['المحكمة']?.trim() !== selectedCourt) {
                return false;
            }

            // Litigation Degree Filter
            if (selectedLitigationDegree !== 'all' && s['درجة_التقاضي']?.trim() !== selectedLitigationDegree) {
                return false;
            }

            // Plaintiff Filter
            if (selectedPlaintiff !== 'all' && s['المدعي']?.trim() !== selectedPlaintiff) {
                return false;
            }

            return true;
        });
    }, [uniqueCasesMap, searchQuery, selectedJudgmentStatus, selectedCourt, selectedPlaintiff, selectedLitigationDegree]);

    // Total value of currently filtered cases
    const filteredTotalValue = useMemo(() => {
        return filteredCases.reduce((sum, s) => sum + parseCurrencyValue(s['قيمة المخالفة']), 0);
    }, [filteredCases]);

    // Export to Excel
    const handleExportExcel = () => {
        const exportData = filteredCases.map((s, idx) => ({
            'م': idx + 1,
            'رقم الدعوى الموحد': s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'] || '-',
            'درجة التقاضي': s['درجة_التقاضي'] || '-',
            'رقم الدعوى الفرعي': s['رقم الدعوى'] || '-',
            'تاريخ المخالفة': formatViolationDate(s['تاريخ المخالفة']),
            'رقم المخالفة': s['رقم المخالفة'] || '-',
            'حالة الحكم النهائي': s['حكم_نهائي'] || 'قيد المداولة',
            'قيمة المخالفة (ر.س)': parseCurrencyValue(s['قيمة المخالفة']),
            'المدعي': s['المدعي'] || '-',
            'المحكمة': s['المحكمة'] || '-',
            'نوع الدعوى': s['نوع الدعوى'] || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الأحكام النهائية");
        XLSX.writeFile(wb, `تقرير_الأحكام_النهائية_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-emerald-600 pb-4 mb-4">
                <h1 className="text-2xl font-black text-dark">تقرير الأحكام النهائية للدعاوى</h1>
                <p className="text-xs font-bold text-dark/70 mt-1">مكتب المحامي عبد الله سعود آل سعد للمحاماة والاستشارات القانونية</p>
                <div className="flex justify-between items-center text-[10px] font-bold text-dark/60 mt-3 px-2">
                    <span>إجمالي الدعاوى الفريدة: {filteredCases.length}</span>
                    <span>مجموع المبالغ: {formatCurrency(overallStats.totalValue)} ر.س</span>
                    <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</span>
                </div>
            </div>

            {/* Header section (screen mode) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                        <DocumentTextIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-dark tracking-tight">تقرير الأحكام النهائية</h1>
                        <p className="text-xs font-bold text-dark/60 mt-1">
                            متابعة وتوثيق حالة الأحكام النهائية للدعاوى فريدة برقم الدعوى
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-light hover:bg-border text-dark rounded-xl text-xs font-bold transition-all border border-border/80 cursor-pointer"
                    >
                        <PrinterIcon className="w-4 h-4 text-dark/70" />
                        <span>طباعة التقرير</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>تصدير إكسيل</span>
                    </button>
                </div>
            </div>

            {/* KPI Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid print:grid-cols-3 print:gap-3 print:mb-6">
                <StatCard 
                    title="إجمالي الدعاوى الفريدة" 
                    value={filteredCases.length}
                    subtitle={`من أصل ${overallStats.totalUniqueCases} دعوى`} 
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    color="primary"
                />
                <StatCard 
                    title="حكم نهائي إلغاء القرار" 
                    value={`${overallStats.annulmentCount} (${formatCurrency(overallStats.annulmentValue)} ر.س)`}
                    subtitle="دعاوى صدر بها حكم نهائي بالإلغاء" 
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    color="green"
                />
                <StatCard 
                    title={selectedJudgmentStatus !== 'all' ? `مبالغ المخالفات (${selectedJudgmentStatus})` : 'مجموع مبالغ المخالفات'} 
                    value={`${formatCurrency(filteredTotalValue)} ر.س`}
                    subtitle={selectedJudgmentStatus !== 'all' ? `إجمالي المبالغ للحالة المختارة` : 'إجمالي مبالغ المخالفات المعروضة'} 
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    color="blue"
                />
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-4 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">بحث شامل:</label>
                        <input
                            type="text"
                            placeholder="رقم الدعوى الموحد، المخالفة..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark placeholder:text-dark/40 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    {/* Judgment Status Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">حالة الحكم النهائي:</label>
                        <select
                            value={selectedJudgmentStatus}
                            onChange={e => setSelectedJudgmentStatus(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">كافة الحالات ({judgmentStatuses.length})</option>
                            {judgmentStatuses.map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                    </div>

                    {/* Litigation Degree Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">درجة التقاضي:</label>
                        <select
                            value={selectedLitigationDegree}
                            onChange={e => setSelectedLitigationDegree(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">كافة درجات التقاضي ({uniqueLitigationDegrees.length})</option>
                            {uniqueLitigationDegrees.map(ld => (
                                <option key={ld} value={ld}>{ld}</option>
                            ))}
                        </select>
                    </div>

                    {/* Court Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">المحكمة:</label>
                        <select
                            value={selectedCourt}
                            onChange={e => setSelectedCourt(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">كافة المحاكم ({uniqueCourts.length})</option>
                            {uniqueCourts.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plaintiff Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">المدعي:</label>
                        <select
                            value={selectedPlaintiff}
                            onChange={e => setSelectedPlaintiff(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">جميع المدعين ({uniquePlaintiffs.length})</option>
                            {uniquePlaintiffs.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border/50 text-xs gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-dark/70 font-bold">
                        <span>عدد النتائج المطابقة: <strong className="text-emerald-700">{filteredCases.length}</strong> من أصل {uniqueCasesMap.length}</span>
                        <span className="text-border/80">|</span>
                        <span>إجمالي قيمة المخالفات: <strong className="text-emerald-800 dir-ltr">{formatCurrency(filteredTotalValue)} ر.س</strong></span>
                    </div>
                    {(searchQuery || selectedJudgmentStatus !== 'all' || selectedCourt !== 'all' || selectedPlaintiff !== 'all' || selectedLitigationDegree !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedJudgmentStatus('all');
                                setSelectedCourt('all');
                                setSelectedPlaintiff('all');
                                setSelectedLitigationDegree('all');
                            }}
                            className="text-emerald-700 hover:underline font-bold cursor-pointer"
                        >
                            إعادة ضبط الفلاتر
                        </button>
                    )}
                </div>
            </div>

            {/* Table of Final Judgments */}
            {filteredCases.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-border text-center space-y-3">
                    <p className="text-base font-bold text-dark/70">لا توجد دعاوى مطابقة لشروط البحث أو الفلتر المحدد.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-light border-b border-border text-dark/70 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 w-12 text-center">#</th>
                                    <th className="p-4">رقم الدعوى الموحد</th>
                                    <th className="p-4 text-center">درجة التقاضي</th>
                                    <th className="p-4 text-center">تاريخ المخالفة</th>
                                    <th className="p-4">رقم المخالفة</th>
                                    <th className="p-4">المدعي</th>
                                    <th className="p-4 text-center">حالة الحكم النهائي</th>
                                    <th className="p-4 text-left">قيمة المخالفة</th>
                                    <th className="p-4 text-center print:hidden">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 font-medium text-dark">
                                {filteredCases.map((s, idx) => {
                                    const judgmentStatus = (s['حكم_نهائي'] || 'قيد المداولة').trim();
                                    const value = parseCurrencyValue(s['قيمة المخالفة']);

                                    let badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                                    if (judgmentStatus.includes('إلغاء القرار')) {
                                        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                    } else if (judgmentStatus.includes('عدم القبول') || judgmentStatus.includes('رفض')) {
                                        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                                    } else if (judgmentStatus.includes('تأييد')) {
                                        badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
                                    }

                                    return (
                                        <tr key={`${s['رقم_الدعوى_الموحد'] || s['رقم الدعوى']}-${idx}`} className="hover:bg-light/50 transition-colors">
                                            <td className="p-4 text-center font-bold text-dark/40">{idx + 1}</td>
                                            <td className="p-4 font-black text-dark">
                                                <div className="flex flex-col">
                                                    <span>{s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'] || '-'}</span>
                                                    {s['رقم_الدعوى_الموحد'] && s['رقم الدعوى'] && s['رقم الدعوى'] !== s['رقم_الدعوى_الموحد'] && (
                                                        <span className="text-[10px] text-dark/50 font-normal">فرعي: {s['رقم الدعوى']}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-bold">
                                                {s['درجة_التقاضي'] ? (
                                                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                        {s['درجة_التقاضي']}
                                                    </span>
                                                ) : (
                                                    <span className="text-dark/40">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center font-bold text-dark/80 dir-ltr">
                                                {formatViolationDate(s['تاريخ المخالفة'])}
                                            </td>
                                            <td className="p-4 font-bold text-dark/80 dir-ltr">
                                                {s['رقم المخالفة'] || '-'}
                                            </td>
                                            <td className="p-4 font-bold text-dark">
                                                {s['المدعي'] || '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${badgeStyle}`}>
                                                    {judgmentStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 text-left font-black text-emerald-900 dir-ltr">
                                                {value > 0 ? `${formatCurrency(value)} ر.س` : '-'}
                                            </td>
                                            <td className="p-4 text-center print:hidden">
                                                <button
                                                    onClick={() => {
                                                        const unifiedNo = s['رقم_الدعوى_الموحد'] || s['رقم الدعوى'];
                                                        const caseSessions = sessions.filter(sess => (sess['رقم_الدعوى_الموحد'] || sess['رقم الدعوى']) === unifiedNo);
                                                        const rulingSess = caseSessions.find(sess => {
                                                            const st = (sess['حالة_الدعوى'] || '').toString().trim();
                                                            return !st.includes('تأجيل');
                                                        }) || s;
                                                        onSessionClick?.(rulingSess);
                                                    }}
                                                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold text-[11px] rounded-lg transition-all"
                                                >
                                                    عرض التفاصيل
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinalJudgmentsReport;
