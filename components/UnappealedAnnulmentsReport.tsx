import React, { useMemo, useState, useEffect } from 'react';
import type { CaseSession } from '../types';
import StatCard from './StatCard';
import { DocumentTextIcon, PrinterIcon, TableCellsIcon, UserIcon, CalendarIcon, CheckCircleIcon } from './icons';
import { utils, writeFile } from 'xlsx';
import { calculateDaysFromDate, getBestSessionDate } from '../utils/caseHelpers';
import { fetchUmmAlQuraToday } from '../utils/ummAlQura';

interface UnappealedAnnulmentsReportProps {
    sessions: CaseSession[];
    onSessionClick?: (session: CaseSession) => void;
}

const UnappealedAnnulmentsReport: React.FC<UnappealedAnnulmentsReportProps> = ({ sessions, onSessionClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourt, setSelectedCourt] = useState<string>('all');
    const [selectedPlaintiff, setSelectedPlaintiff] = useState<string>('all');
    const [selectedDaysFilter, setSelectedDaysFilter] = useState<string>('all');
    const [selectedCaseStatus, setSelectedCaseStatus] = useState<string>('all');
    const [umqData, setUmqData] = useState<{
        gregorianDateObj: Date;
        hijriDateObj: { year: number; month: number; day: number; nameAr: string } | null;
        gregorianDateInfo: { year: number; month: number; day: number; nameAr: string } | null;
    } | null>(null);

    useEffect(() => {
        fetchUmmAlQuraToday().then(res => {
            if (res) setUmqData(res);
        });
    }, []);

    // Helper to parse numbers
    const normalizeNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = val.toString().trim();
        const cleanMain = s.replace(/[^\d.]/g, '');
        const parsed = parseFloat(cleanMain);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    };

    // 1. Identify all violation numbers or case numbers that have an appeal case or appeal request = 'نعم'
    const appealViolationNumbers = useMemo(() => {
        const set = new Set<string>();
        sessions.forEach(s => {
            const caseType = (s['نوع الدعوى'] || '').toString().trim();
            const violationNo = (s['رقم المخالفة'] || '').toString().trim();
            const appealReq = (s['طلب_استئناف'] || '').toString().trim();

            if ((caseType.includes('استئناف') || appealReq === 'نعم') && violationNo !== '') {
                set.add(violationNo);
            }
        });
        return set;
    }, [sessions]);

    // 2. Identify initial cases with annulment rulings
    const allInitialAnnulledSessions = useMemo(() => {
        return sessions.filter(s => {
            const status = (s['حالة_الدعوى'] || '').toString().trim();
            const caseType = (s['نوع الدعوى'] || '').toString().trim();
            const appealReq = (s['طلب_استئناف'] || '').toString().trim();

            // Exclude appeal sessions or cases where appeal request is "نعم"
            if (caseType.includes('استئناف') || appealReq === 'نعم') return false;
            return status === 'إلغاء القرار' || status === 'تنفيذ حكم إلغاء القرار' || status.includes('إلغاء');
        });
    }, [sessions]);

    // Total unique initial annulled cases map for stats
    const totalAnnulledMap = useMemo(() => {
        const map = new Map<string, CaseSession>();
        allInitialAnnulledSessions.forEach(s => {
            const vNo = (s['رقم المخالفة'] || '').toString().trim();
            const caseNo = (s['رقم الدعوى'] || '').toString().trim();
            const key = vNo !== '' ? vNo : (caseNo !== '' ? `c_${caseNo}` : `id_${s.id}`);
            if (!map.has(key)) {
                map.set(key, s);
            }
        });
        return map;
    }, [allInitialAnnulledSessions]);

    // 3. Filter for unappealed annulments (unique cases with no appeal request)
    const unappealedAnnulledSessions = useMemo(() => {
        const map = new Map<string, CaseSession>();
        allInitialAnnulledSessions.forEach(s => {
            const vNo = (s['رقم المخالفة'] || '').toString().trim();
            const caseNo = (s['رقم الدعوى'] || '').toString().trim();
            const appealReq = (s['طلب_استئناف'] || '').toString().trim();

            // Must NOT have request for appeal = "نعم"
            if (appealReq === 'نعم') return;

            if (vNo !== '') {
                if (!appealViolationNumbers.has(vNo)) {
                    if (!map.has(vNo)) {
                        map.set(vNo, s);
                    }
                }
            } else if (caseNo !== '') {
                const isAppealed = sessions.some(sec => 
                    ((sec['نوع الدعوى'] || '').toString().includes('استئناف') || (sec['طلب_استئناف'] || '').toString().trim() === 'نعم') && 
                    (sec['رقم الدعوى'] || '').toString().trim() === caseNo
                );
                if (!isAppealed && !map.has(`c_${caseNo}`)) {
                    map.set(`c_${caseNo}`, s);
                }
            } else {
                map.set(`id_${s.id}`, s);
            }
        });
        return Array.from(map.values());
    }, [allInitialAnnulledSessions, appealViolationNumbers, sessions]);

    // Statistics
    const stats = useMemo(() => {
        const totalAnnulledCount = totalAnnulledMap.size;
        const unappealedCount = unappealedAnnulledSessions.length;
        const appealedCount = Math.max(0, totalAnnulledCount - unappealedCount);

        let totalUnappealedValue = 0;
        const uniqueViolations = new Set<string>();

        unappealedAnnulledSessions.forEach(s => {
            const val = normalizeNumber(s['قيمة المخالفة']);
            totalUnappealedValue += val;

            const vNo = (s['رقم المخالفة'] || '').toString().trim();
            if (vNo) uniqueViolations.add(vNo);
        });

        const unappealedRatio = totalAnnulledCount > 0 
            ? Math.round((unappealedCount / totalAnnulledCount) * 100) 
            : 0;

        return {
            totalAnnulledCount,
            unappealedCount,
            appealedCount,
            totalUnappealedValue,
            uniqueViolationsCount: uniqueViolations.size,
            unappealedRatio
        };
    }, [totalAnnulledMap, unappealedAnnulledSessions]);

    // Unique lists for filter dropdowns
    const uniqueCourts = useMemo(() => {
        const set = new Set<string>();
        unappealedAnnulledSessions.forEach(s => {
            const court = (s['المحكمة'] || '').toString().trim();
            if (court) set.add(court);
        });
        return Array.from(set).sort();
    }, [unappealedAnnulledSessions]);

    const uniquePlaintiffs = useMemo(() => {
        const set = new Set<string>();
        unappealedAnnulledSessions.forEach(s => {
            const p = (s['المدعي'] || '').toString().trim();
            if (p) set.add(p);
        });
        return Array.from(set).sort();
    }, [unappealedAnnulledSessions]);

    const uniqueCaseStatuses = useMemo(() => {
        const set = new Set<string>();
        unappealedAnnulledSessions.forEach(s => {
            const st = (s['حالة_الدعوى'] || '').toString().trim();
            if (st) set.add(st);
        });
        return Array.from(set).sort();
    }, [unappealedAnnulledSessions]);

    // Statistics for days passed
    const daysStats = useMemo(() => {
        let count50Plus = 0;
        let countUnder50 = 0;
        unappealedAnnulledSessions.forEach(s => {
            const dateStr = getBestSessionDate(s);
            const days = calculateDaysFromDate(dateStr, umqData?.gregorianDateObj);
            if (days !== null && days >= 50) {
                count50Plus++;
            } else if (days !== null) {
                countUnder50++;
            }
        });
        return { count50Plus, countUnder50 };
    }, [unappealedAnnulledSessions, umqData]);

    // Filtered session list based on user search & select filters
    const filteredSessions = useMemo(() => {
        return unappealedAnnulledSessions.filter(s => {
            const court = (s['المحكمة'] || '').toString().trim();
            const plaintiff = (s['المدعي'] || '').toString().trim();
            const caseStatus = (s['حالة_الدعوى'] || '').toString().trim();
            const dateStr = getBestSessionDate(s);
            const daysPassed = calculateDaysFromDate(dateStr, umqData?.gregorianDateObj);

            if (selectedCourt !== 'all' && court !== selectedCourt) return false;
            if (selectedPlaintiff !== 'all' && plaintiff !== selectedPlaintiff) return false;
            if (selectedCaseStatus !== 'all' && caseStatus !== selectedCaseStatus) return false;

            if (selectedDaysFilter === '50plus') {
                if (daysPassed === null || daysPassed < 50) return false;
            } else if (selectedDaysFilter === 'under50') {
                if (daysPassed === null || daysPassed >= 50) return false;
            }

            if (searchQuery.trim() !== '') {
                const q = searchQuery.trim().toLowerCase();
                const caseNo = (s['رقم الدعوى'] || '').toString().toLowerCase();
                const violationNo = (s['رقم المخالفة'] || '').toString().toLowerCase();
                const lawyer = (s['المحامي المكلف'] || '').toString().toLowerCase();
                const courtName = court.toLowerCase();
                const plaintiffName = plaintiff.toLowerCase();
                const caseStatusName = caseStatus.toLowerCase();
                const searchLocation = (s['البحث_عن_الدعوى'] || '').toString().toLowerCase();
                const appealReq = (s['طلب_استئناف'] || '').toString().toLowerCase();

                return caseNo.includes(q) || 
                       violationNo.includes(q) || 
                       lawyer.includes(q) || 
                       courtName.includes(q) || 
                       plaintiffName.includes(q) ||
                       caseStatusName.includes(q) ||
                       searchLocation.includes(q) ||
                       appealReq.includes(q);
            }

            return true;
        });
    }, [unappealedAnnulledSessions, selectedCourt, selectedPlaintiff, selectedCaseStatus, selectedDaysFilter, searchQuery, umqData]);

    // Export to Excel
    const handleExportExcel = () => {
        const data = filteredSessions.map((s, idx) => {
            const dateStr = getBestSessionDate(s);
            const daysPassed = calculateDaysFromDate(dateStr, umqData?.gregorianDateObj);

            return {
                'م': idx + 1,
                'رقم الدعوى': s['رقم الدعوى'] || '-',
                'رقم المخالفة': s['رقم المخالفة'] || '-',
                'المدعي': s['المدعي'] || '-',
                'المحكمة': s['المحكمة'] || '-',
                'الدائرة': s['الدائرة'] || '-',
                'المحامي المكلف': s['المحامي المكلف'] || '-',
                'تاريخ الموعد': dateStr || '-',
                'عدد الأيام إلى اليوم': daysPassed !== null ? daysPassed : '-',
                'حالة الدعوى': s['حالة_الدعوى'] || 'إلغاء القرار',
                'طلب استئناف': s['طلب_استئناف'] || 'لا',
                'البحث عن الدعوى / مكان الملف': s['البحث_عن_الدعوى'] || '-',
                'قيمة المخالفة (ر.س)': normalizeNumber(s['قيمة المخالفة']),
                'حالة الاستئناف': 'لم يتم الاستئناف'
            };
        });

        const ws = utils.json_to_sheet(data);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "دعاوى إلغاء لم تستأنف");
        writeFile(wb, `دعاوى_إلغاء_القرار_غير_المستأنفة_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Print report
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Print Header (Visible only when printing) */}
            <div className="hidden print:block text-center border-b-2 border-emerald-600 pb-4 mb-4">
                <h1 className="text-2xl font-black text-dark">تقرير دعاوى إلغاء القرار التي لم تُستأنف</h1>
                <p className="text-xs font-bold text-dark/70 mt-1">مكتب المحامي عبد الله سعود آل سعد للمحاماة والاستشارات القانونية</p>
                <div className="flex justify-between items-center text-[10px] font-bold text-dark/60 mt-3 px-2">
                    <span>إجمالي الدعاوى المطابقة: {filteredSessions.length}</span>
                    <span>مجموع مبالغ المخالفات: {formatCurrency(stats.totalUnappealedValue)} ر.س</span>
                    <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</span>
                </div>
            </div>

            {/* Header section (screen mode) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
                        <DocumentTextIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl md:text-3xl font-black text-dark tracking-tight">
                                دعاوى إلغاء القرار التي لم تُستأنف
                            </h2>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                                {stats.unappealedCount} دعوى
                            </span>
                        </div>
                        <p className="text-dark/60 font-medium text-sm mt-1">
                            حصر الأحكام الابتدائية الصادرة بإلغاء القرار والتي لم يتم تقديم طلب استئناف لها بنفس رقم المخالفة
                        </p>
                        {umqData && (
                            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-2xs">
                                <CalendarIcon className="w-4 h-4 text-amber-700" />
                                <span>تاريخ اليوم بمدينة مكة (تقويم أم القرى - KACST):</span>
                                {umqData.hijriDateObj ? (
                                    <span className="text-amber-800 font-black">
                                        {umqData.hijriDateObj.day} {umqData.hijriDateObj.nameAr} {umqData.hijriDateObj.year} هـ
                                        {umqData.gregorianDateInfo && ` (${umqData.gregorianDateInfo.day} ${umqData.gregorianDateInfo.nameAr} ${umqData.gregorianDateInfo.year} م)`}
                                    </span>
                                ) : (
                                    <span className="text-amber-800 font-black">
                                        {umqData.gregorianDateObj.toLocaleDateString('ar-SA')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <TableCellsIcon className="w-4 h-4" />
                        تصدير Excel
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <PrinterIcon className="w-4 h-4" />
                        طباعة
                    </button>
                </div>
            </div>

            {/* KPI Cards (Visible on screen and in print) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:grid print:grid-cols-4 print:gap-3 print:mb-6">
                <StatCard 
                    title="إجمالي أحكام الإلغاء الغير مستأنفة" 
                    value={stats.unappealedCount}
                    subtitle={`من أصل ${stats.totalAnnulledCount} حكم إلغاء ابتدائي`}
                    color="green"
                    icon={<CheckCircleIcon className="w-8 h-8" />}
                />
                <StatCard 
                    title="مجموع مبالغ المخالفات" 
                    value={`${formatCurrency(stats.totalUnappealedValue)} ر.س`}
                    subtitle={`لعدد ${stats.uniqueViolationsCount} مخالفة فريدة`}
                    color="blue"
                    icon={<DocumentTextIcon className="w-8 h-8" />}
                />
                <StatCard 
                    title="دعاوى تم الاستئناف عليها" 
                    value={stats.appealedCount}
                    subtitle="مستأنفة برقم مخالفة مطابق"
                    color="amber"
                    icon={<DocumentTextIcon className="w-8 h-8" />}
                />
                <StatCard 
                    title="نسبة عدم الاستئناف" 
                    value={`% ${stats.unappealedRatio}`}
                    subtitle="نسبة الأحكام التي لم تُستأنف"
                    color="purple"
                    icon={<DocumentTextIcon className="w-8 h-8" />}
                />
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-4 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">بحث شامل:</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="ابحث برقم الدعوى، رقم المخالفة..."
                                className="w-full bg-light border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text/50 hover:text-dark"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Case Status Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">حالة الدعوى الابتدائي:</label>
                        <select 
                            value={selectedCaseStatus} 
                            onChange={e => setSelectedCaseStatus(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">كافة الحالات ({uniqueCaseStatuses.length})</option>
                            {uniqueCaseStatuses.map((st, i) => (
                                <option key={`${st}-${i}`} value={st}>{st}</option>
                            ))}
                        </select>
                    </div>

                    {/* Days / Period Filter Dropdown */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5 flex items-center justify-between">
                            <span>المدة من صدور الحكم:</span>
                            {daysStats.count50Plus > 0 && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black">
                                    {daysStats.count50Plus} حكم ≥ 50 يوم
                                </span>
                            )}
                        </label>
                        <select 
                            value={selectedDaysFilter} 
                            onChange={e => setSelectedDaysFilter(e.target.value)}
                            className="w-full bg-light border border-amber-300/80 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                        >
                            <option value="all">كافة المدد ({unappealedAnnulledSessions.length})</option>
                            <option value="50plus">أحكام مر عليها 50 يوم فأكثر ولم تُستأنف ({daysStats.count50Plus})</option>
                            <option value="under50">أقل من 50 يوم ({daysStats.countUnder50})</option>
                        </select>
                    </div>

                    {/* Court Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">تصفية حسب المحكمة:</label>
                        <select 
                            value={selectedCourt} 
                            onChange={e => setSelectedCourt(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">كافة المحاكم ({uniqueCourts.length})</option>
                            {uniqueCourts.map((c, i) => (
                                <option key={`${c}-${i}`} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plaintiff Filter */}
                    <div>
                        <label className="block text-xs font-bold text-dark/70 mb-1.5">تصفية حسب المدعي:</label>
                        <select 
                            value={selectedPlaintiff} 
                            onChange={e => setSelectedPlaintiff(e.target.value)}
                            className="w-full bg-light border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">كافة المدعين ({uniquePlaintiffs.length})</option>
                            {uniquePlaintiffs.map((p, i) => (
                                <option key={`${p}-${i}`} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {(searchQuery || selectedCourt !== 'all' || selectedPlaintiff !== 'all' || selectedCaseStatus !== 'all' || selectedDaysFilter !== 'all') && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <span className="text-dark/60 font-medium flex items-center gap-2">
                            <span>عدد النتائج المطابقة: <strong className="text-emerald-700">{filteredSessions.length}</strong> من أصل {unappealedAnnulledSessions.length}</span>
                            {selectedDaysFilter === '50plus' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-bold">
                                    تصفية: أحكام 50 يوم فأكثر فقط
                                </span>
                            )}
                        </span>
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCourt('all');
                                setSelectedPlaintiff('all');
                                setSelectedCaseStatus('all');
                                setSelectedDaysFilter('all');
                            }}
                            className="text-emerald-700 hover:underline font-bold"
                        >
                            إلغاء التصفية
                        </button>
                    </div>
                )}
            </div>

            {/* Sessions Table View */}
            {filteredSessions.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-border text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-dark">لا توجد دعاوى إلغاء غير مستأنفة تطابق محددات البحث</h3>
                    <p className="text-xs text-dark/50 max-w-md mx-auto">
                        جميع دعاوى إلغاء القرار في النظام إما استُأنفت أو لا توجد سجلات مطابقة للفلتر المحدد حالياً.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-emerald-900 text-white text-xs font-bold">
                                    <th className="p-4 w-12 text-center">#</th>
                                    <th className="p-4">رقم الدعوى</th>
                                    <th className="p-4">رقم المخالفة</th>
                                    <th className="p-4">المدعي</th>
                                    <th className="p-4">المحكمة / الدائرة</th>
                                    <th className="p-4">المحامي المكلف</th>
                                    <th className="p-4">تاريخ الموعد</th>
                                    <th className="p-4 text-center">عدد الأيام إلى اليوم</th>
                                    <th className="p-4 text-center">حالة الدعوى</th>
                                    <th className="p-4 text-center">طلب استئناف</th>
                                    <th className="p-4 min-w-[200px]">البحث عن الدعوى (مكان الملف)</th>
                                    <th className="p-4 text-left">قيمة المخالفة</th>
                                    <th className="p-4 text-center print:hidden">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs font-medium">
                                {filteredSessions.map((session, index) => {
                                    const value = normalizeNumber(session['قيمة المخالفة']);
                                    const dateStr = getBestSessionDate(session);
                                    const daysPassed = calculateDaysFromDate(dateStr, umqData?.gregorianDateObj);

                                    return (
                                        <tr 
                                            key={`${session.id}-${index}`}
                                            className="hover:bg-emerald-50/40 transition-colors"
                                        >
                                            <td className="p-4 text-center font-bold text-dark/50">{index + 1}</td>
                                            <td className="p-4 font-bold text-dark">
                                                #{session['رقم الدعوى'] || '-'}
                                            </td>
                                            <td className="p-4 font-bold text-emerald-800 dir-ltr text-right">
                                                {session['رقم المخالفة'] || '-'}
                                            </td>
                                            <td className="p-4 font-bold text-dark">
                                                {session['المدعي'] || '-'}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-dark">{session['المحكمة'] || '-'}</div>
                                                <div className="text-[10px] text-dark/50">{session['الدائرة'] || ''}</div>
                                            </td>
                                            <td className="p-4 font-bold text-dark/80">
                                                {session['المحامي المكلف'] || '-'}
                                            </td>
                                            <td className="p-4 text-dark/70 dir-ltr text-right">
                                                {dateStr || '-'}
                                            </td>
                                            <td className="p-4 text-center font-bold">
                                                {daysPassed !== null ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg text-xs font-black shadow-xs">
                                                        {daysPassed} يوم
                                                    </span>
                                                ) : (
                                                    <span className="text-dark/40">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                                                    {session['حالة_الدعوى'] || 'إلغاء القرار'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                                                    {session['طلب_استئناف'] || 'لا'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {session['البحث_عن_الدعوى'] ? (
                                                    <div className="text-[11px] leading-relaxed text-dark/80 font-medium">
                                                        {session['البحث_عن_الدعوى']}
                                                    </div>
                                                ) : (
                                                    <span className="text-dark/30">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-left font-black text-emerald-900 dir-ltr">
                                                {value > 0 ? `${formatCurrency(value)} ر.س` : '-'}
                                            </td>
                                            <td className="p-4 text-center print:hidden">
                                                <button
                                                    onClick={() => onSessionClick?.(session)}
                                                    className="px-3 py-1.5 bg-light hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] rounded-lg transition-all border border-border"
                                                >
                                                    التفاصيل
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

export default UnappealedAnnulmentsReport;
