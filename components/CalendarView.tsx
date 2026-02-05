import React from 'react';
import type { SessionsByDate } from '../types';
import { CalendarIcon, WarningIcon } from './icons';

interface CalendarDay {
    date: string;
    total: number;
    conflicts: number;
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
                        ? 'bg-amber-500 text-white' 
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                >
                    <WarningIcon className="w-4 h-4 ml-1.5" />
                    عرض التعارضات
                </button>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {sortedData.map(({ date, total, conflicts }) => {
                    const isSelected = date === selectedDate && !isShowingAllConflicts;
                    const isAllSessionsSelected = isSelected && !showOnlyConflictsInDetails;
                    const isConflictsSelected = isSelected && showOnlyConflictsInDetails;

                    return (
                        <div
                            key={date}
                            onClick={() => onDateSelect(date, false)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDateSelect(date, false)}
                            className={`w-full text-right p-3 rounded-md transition-all duration-200 flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                                isAllSessionsSelected 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'bg-light hover:bg-border text-dark'
                            }`}
                        >
                            <span className="font-semibold">{date}</span>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                {conflicts > 0 && (
                                    <span 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDateSelect(date, true);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' '){
                                                e.stopPropagation();
                                                onDateSelect(date, true);
                                            }
                                        }}
                                        className={`px-2.5 py-0.5 rounded-full text-sm font-medium transition-colors ${
                                            isConflictsSelected ? 'bg-white text-amber-600 ring-2 ring-amber-300' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        }`}
                                    >
                                        {conflicts} تعارض
                                    </span>
                                )}
                                <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                    isAllSessionsSelected ? 'bg-white text-primary' : 'bg-border text-dark'
                                }`}>
                                    {total} جلسات
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
