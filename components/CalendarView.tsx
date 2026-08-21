
import React, { useMemo, useEffect } from 'react';
import type { CaseSession } from '../types';
import { CalendarIcon, WarningIcon, BriefcaseIcon, ClipboardDocumentListIcon, CalendarForwardIcon } from './icons';
import { matchSessionSearch } from '../utils/searchUtils';

interface CalendarDay {
    date: string;
    total: number;
    conflicts: number;
    lawyersCount: number;
    sessions: CaseSession[];
}

interface CalendarViewProps {
    calendarData: CalendarDay[];
    onDateSelect: (date: string, showConflictsOnly: boolean) => void;
    selectedDate: string | null;
    onShowAllConflictsToggle: () => void;
    isShowingAllConflicts: boolean;
    showOnlyConflictsInDetails: boolean;
    showOnlyUpcomingDays: boolean;
    onShowOnlyUpcomingDaysToggle: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
    calendarData, 
    onDateSelect, 
    selectedDate, 
    onShowAllConflictsToggle, 
    isShowingAllConflicts, 
    showOnlyUpcomingDays,
    onShowOnlyUpcomingDaysToggle,
    searchQuery,
    onSearchChange
}) => {

    const sortedData = useMemo(() => {
        return [...calendarData].sort((a, b) => {
            const parse = (d: string) => {
                const parts = d.split('-');
                if (parts.length !== 3) return 0;
                return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
            };
            return parse(a.date) - parse(b.date);
        });
    }, [calendarData]);

    const filteredData = useMemo(() => {
        let data = sortedData;

        // 1. فلترة الأيام المقبلة
        if (showOnlyUpcomingDays) {
            const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
                year: 'numeric', month: 'numeric', day: 'numeric'
            });
            const parts = formatter.formatToParts(new Date());
            const todayHijri = {
                y: parseInt(parts.find(p => p.type === 'year')?.value || '0', 10),
                m: parseInt(parts.find(p => p.type === 'month')?.value || '0', 10),
                d: parseInt(parts.find(p => p.type === 'day')?.value || '0', 10),
            };
            
            data = data.filter(day => {
                const p = day.date.split('-');
                if(p.length !== 3) return true;
                const [d, m, y] = p.map(Number);
                if (y > todayHijri.y) return true;
                if (y < todayHijri.y) return false;
                if (m > todayHijri.m) return true;
                if (m < todayHijri.m) return false;
                return d >= todayHijri.d;
            });
        }

        // 2. فلترة التعارضات فقط
        if (isShowingAllConflicts) {
            data = data.filter(day => day.conflicts > 0);
        }

        // 3. البحث برقم الدعوى الموحد أو درجة التقاضي أو رقم الدعوى أو الجلسة أو المخالفة
        if (searchQuery.trim()) {
            data = data.filter(day => {
                return day.sessions.some(s => matchSessionSearch(s, searchQuery));
            });
        }

        return data;
    }, [sortedData, showOnlyUpcomingDays, isShowingAllConflicts, searchQuery]);

    // عند البحث، إذا كان اليوم المختار غير موجود ضمن النتائج، يتم اختيار أول يوم مطابق تلقائياً
    useEffect(() => {
        if (searchQuery.trim() && filteredData.length > 0) {
            const isCurrentDateInFiltered = filteredData.some(d => d.date === selectedDate);
            if (!isCurrentDateInFiltered) {
                onDateSelect(filteredData[0].date, false);
            }
        }
    }, [searchQuery, filteredData, selectedDate, onDateSelect]);

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm flex flex-col min-h-[650px]">
            <div className="flex flex-col gap-5 mb-8 px-2">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-6 h-6 text-[#8c7851]" />
                    <h2 className="text-2xl font-black text-[#4a4130]">أيام الجلسات</h2>
                </div>

                {/* حقل البحث بالرقم الموحد وغيره */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="بحث برقم الدعوى الموحد / الجلسة / المخالفة..." 
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-[#f7f5f2] border border-border rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text/40"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    {searchQuery && (
                        <button 
                            onClick={() => onSearchChange('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={onShowOnlyUpcomingDaysToggle}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                            showOnlyUpcomingDays 
                            ? 'bg-[#8c7851] text-white' 
                            : 'bg-[#f7f5f2] text-[#6b5f4c] hover:bg-border'
                        }`}
                    >
                        <span>المقبلة</span>
                        <CalendarForwardIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onShowAllConflictsToggle}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm border ${
                            isShowingAllConflicts 
                            ? 'bg-[#b45d0b] text-white border-transparent' 
                            : 'bg-[#fff8ef] text-[#b45d0b] border-[#fae8d0] hover:bg-[#fae8d0]'
                        }`}
                    >
                        <WarningIcon className="w-4 h-4" />
                        <span>التعارضات</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-4">
                {filteredData.length > 0 ? (
                    filteredData.map(({ date, total, conflicts, lawyersCount, sessions }) => {
                        const isSelected = date === selectedDate;
                        const matchingCount = searchQuery.trim() 
                            ? sessions.filter(s => matchSessionSearch(s, searchQuery)).length 
                            : total;

                        return (
                            <div
                                key={date}
                                onClick={() => onDateSelect(date, false)}
                                className={`relative p-5 rounded-[2rem] transition-all duration-300 cursor-pointer flex flex-col gap-3 border ${
                                    isSelected 
                                    ? 'bg-[#f9f8f6] border-[#8c7851] shadow-sm' 
                                    : 'bg-[#fcfbf9] border-transparent hover:bg-white hover:border-border hover:shadow-md'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-xs text-[11px] font-bold ${
                                        searchQuery.trim()
                                            ? 'bg-primary/10 text-primary border-primary/20'
                                            : 'bg-white border-border text-dark/60'
                                    }`}>
                                        <ClipboardDocumentListIcon className="w-4 h-4" />
                                        <span>
                                            {searchQuery.trim() ? `${matchingCount} مطابقة (من ${total})` : `${total} جلسات`}
                                        </span>
                                    </div>
                                    <span className="font-black text-xl text-[#4a4130]">{date}</span>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-1">
                                    {conflicts > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef7ec] text-[#b45d0b] text-[10px] font-bold border border-[#fbd38d] animate-pulse">
                                            <WarningIcon className="w-3 h-3 ml-1" />
                                            <span>{conflicts} تعارض</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8c7851]">
                                        <BriefcaseIcon className="w-4 h-4 opacity-70 ml-1" />
                                        <span>{lawyersCount} مكلف</span>
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#8c7851] rounded-l-full"></div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 opacity-40 text-center px-4">
                        <div className="p-4 bg-light rounded-full mb-4">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-border">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <p className="font-bold text-base text-dark/70">لم نجد أي جلسات تطابق بحثك</p>
                        <p className="text-xs text-dark/40 mt-1">تأكد من صحة رقم الدعوى الموحد أو رقم الجلسة</p>
                        <button onClick={() => onSearchChange('')} className="mt-4 px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">إلغاء البحث</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;
