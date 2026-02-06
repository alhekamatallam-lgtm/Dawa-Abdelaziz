import React from 'react';
import { CalendarIcon, WarningIcon, BriefcaseIcon, ClipboardDocumentListIcon } from './icons';

interface CalendarDay {
    date: string;
    total: number;
    conflicts: number;
    lawyersCount: number;
}

interface CalendarViewProps {
    calendarData: CalendarDay[];
    onDateSelect: (date: string, showConflictsOnly: boolean) => void;
    selectedDate: string | null;
    onShowAllConflictsToggle: () => void;
    isShowingAllConflicts: boolean;
    showOnlyConflictsInDetails: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ calendarData, onDateSelect, selectedDate, onShowAllConflictsToggle, isShowingAllConflicts, showOnlyConflictsInDetails }) => {
    const sortedData = [...calendarData].sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
    });

    const dataToDisplay = selectedDate && !isShowingAllConflicts
        ? sortedData.filter(day => day.date === selectedDate)
        : sortedData;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold mr-2 text-dark">أيام الجلسات</h2>
                </div>
                <button 
                    onClick={onShowAllConflictsToggle}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                        isShowingAllConflicts 
                        ? 'bg-amber-500 text-white shadow-lg' 
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                >
                    <WarningIcon className="w-4 h-4 ml-1.5" />
                    عرض التعارضات
                </button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {dataToDisplay.map(({ date, total, conflicts, lawyersCount }) => {
                    const isSelected = date === selectedDate && !isShowingAllConflicts;
                    const isAllSessionsSelected = isSelected && !showOnlyConflictsInDetails;
                    const isConflictsSelected = isSelected && showOnlyConflictsInDetails;

                    return (
                        <div
                            key={date}
                            onClick={() => onDateSelect(date, false)}
                            className={`w-full p-3 rounded-xl transition-all duration-300 flex flex-col gap-2 cursor-pointer border-2 ${
                                isAllSessionsSelected 
                                ? 'bg-primary border-primary text-white shadow-md' 
                                : 'bg-light border-transparent hover:border-primary/30 text-dark'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-base">{date}</span>
                                <div className="flex items-center gap-1.5">
                                     <span className={`flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                        isAllSessionsSelected ? 'bg-white/20 text-white' : 'bg-white text-dark shadow-sm'
                                    }`}>
                                        <ClipboardDocumentListIcon className="w-3 h-3 ml-1 opacity-70" />
                                        {total} جلسات
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {conflicts > 0 && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDateSelect(date, true);
                                        }}
                                        className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-transform hover:scale-105 ${
                                            isConflictsSelected 
                                            ? 'bg-amber-400 text-amber-900 shadow-inner' 
                                            : isAllSessionsSelected ? 'bg-amber-300/30 text-white' : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        <WarningIcon className="w-3 h-3 ml-1" />
                                        {conflicts} تعارض
                                    </button>
                                )}
                                
                                {lawyersCount > 0 && (
                                    <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isAllSessionsSelected ? 'bg-blue-400/30 text-white' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        <BriefcaseIcon className="w-3 h-3 ml-1" />
                                        {lawyersCount} محامي
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;