
import React, { useMemo, useState, useEffect } from 'react';
import type { CaseSession } from '../types';
import SessionTable from './SessionTable';
import { ClockIcon, WarningIcon, ArrowRightIcon, UserGroupIcon, ClipboardDocumentListIcon } from './icons';

interface SessionDetailsProps {
    selectedDate: string | null;
    sessions: CaseSession[];
    onUpdateClick?: (session: CaseSession) => void;
    onViewClick: (session: CaseSession) => void;
    showOnlyConflicts: boolean;
    onBack?: () => void;
    searchQuery?: string;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ 
    selectedDate, 
    sessions, 
    onUpdateClick, 
    onViewClick,
    showOnlyConflicts, 
    onBack,
    searchQuery = ''
}) => {
    const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
    const [selectedPlaintiff, setSelectedPlaintiff] = useState<string | null>(null);
    const [selectedCaseType, setSelectedCaseType] = useState<string | null>(null);
    const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

    // إعادة ضبط الفلاتر عند تغيير التاريخ
    useEffect(() => {
        setSelectedCircuit(null);
        setSelectedPlaintiff(null);
        setSelectedCaseType(null);
        setSelectedCourt(null);
    }, [selectedDate, showOnlyConflicts]);

    const conflictingSessionIds = useMemo(() => {
        if (!sessions || sessions.length === 0) return new Set<number>();
        const timeMap = new Map<string, CaseSession[]>();
        sessions.forEach(session => {
            const time = (session['وقت الموعد'] || '') + (session['ص- م'] || '');
            if (!timeMap.has(time)) timeMap.set(time, []);
            timeMap.get(time)!.push(session);
        });
        const conflictIds = new Set<number>();
        timeMap.forEach(sessionsAtTime => {
            if (sessionsAtTime.length > 1) {
                sessionsAtTime.forEach(s => conflictIds.add(s.id));
            }
        });
        return conflictIds;
    }, [sessions]);

    const conflictFilteredSessions = useMemo(() => {
        return showOnlyConflicts 
            ? sessions.filter(s => conflictingSessionIds.has(s.id))
            : sessions;
    }, [sessions, showOnlyConflicts, conflictingSessionIds]);

    const availableCircuits = useMemo(() => {
        const circuits = new Map<string, number>();
        conflictFilteredSessions.forEach(s => {
            const name = (s['الدائرة'] || '').trim() || 'غير محدد';
            circuits.set(name, (circuits.get(name) || 0) + 1);
        });
        return Array.from(circuits.entries()).sort((a, b) => b[1] - a[1]);
    }, [conflictFilteredSessions]);

    const availablePlaintiffs = useMemo(() => {
        const plaintiffs = new Map<string, number>();
        conflictFilteredSessions.forEach(s => {
            const name = (s['المدعي'] || '').trim() || 'غير محدد';
            plaintiffs.set(name, (plaintiffs.get(name) || 0) + 1);
        });
        return Array.from(plaintiffs.entries()).sort((a, b) => b[1] - a[1]);
    }, [conflictFilteredSessions]);

    const availableCaseTypes = useMemo(() => {
        const caseTypes = new Map<string, number>();
        conflictFilteredSessions.forEach(s => {
            const name = (s['نوع الدعوى'] || '').trim() || 'غير محدد';
            caseTypes.set(name, (caseTypes.get(name) || 0) + 1);
        });
        return Array.from(caseTypes.entries()).sort((a, b) => b[1] - a[1]);
    }, [conflictFilteredSessions]);

    const availableCourts = useMemo(() => {
        const courts = new Map<string, number>();
        conflictFilteredSessions.forEach(s => {
            const name = (s['المحكمة'] || '').trim() || 'غير محدد';
            courts.set(name, (courts.get(name) || 0) + 1);
        });
        return Array.from(courts.entries()).sort((a, b) => b[1] - a[1]);
    }, [conflictFilteredSessions]);

    const sessionsToDisplay = useMemo(() => {
        let filtered = conflictFilteredSessions;
        
        // فلترة البحث
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(s => {
                const caseNum = String(s['رقم الدعوى'] || '').toLowerCase();
                const sessionNum = String(s['رقم الجلسة'] || '').toLowerCase();
                const violationNum = String(s['رقم المخالفة'] || '').toLowerCase();
                return caseNum.includes(query) || sessionNum.includes(query) || violationNum.includes(query);
            });
        }

        if (selectedCircuit) {
            filtered = filtered.filter(s => ((s['الدائرة'] || '').trim() || 'غير محدد') === selectedCircuit);
        }
        if (selectedPlaintiff) {
            filtered = filtered.filter(s => ((s['المدعي'] || '').trim() || 'غير محدد') === selectedPlaintiff);
        }
        if (selectedCaseType) {
            filtered = filtered.filter(s => ((s['نوع الدعوى'] || '').trim() || 'غير محدد') === selectedCaseType);
        }
        if (selectedCourt) {
            filtered = filtered.filter(s => ((s['المحكمة'] || '').trim() || 'غير محدد') === selectedCourt);
        }
        return filtered;
    }, [conflictFilteredSessions, selectedCircuit, selectedPlaintiff, selectedCaseType, selectedCourt, searchQuery]);

    const handleResetFilters = () => {
        setSelectedCircuit(null);
        setSelectedPlaintiff(null);
        setSelectedCaseType(null);
        setSelectedCourt(null);
    };

    if (!selectedDate) {
        return (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
                <div className="w-32 h-32 bg-[#f9f8f6] rounded-full flex items-center justify-center mb-10 shadow-inner">
                    <ClockIcon className="w-16 h-16 text-[#e2dfd9]" />
                </div>
                <h3 className="text-4xl font-black text-[#4a4130] mb-5 tracking-tight">اختر يوماً من القائمة</h3>
                <p className="text-[#6b5f4c] opacity-50 max-w-sm mx-auto leading-relaxed text-lg">لعرض تفاصيل الجلسات والدوائر المتاحة للموعد المختار في الجدول الزمني.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-3 duration-500 overflow-hidden flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col gap-6 mb-8 w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4 text-right">
                        {onBack && (
                            <button onClick={onBack} className="lg:hidden p-3 rounded-full hover:bg-[#f7f5f2] transition-colors border border-border">
                                <ArrowRightIcon className="w-6 h-6 text-[#6b5f4c]" />
                            </button>
                        )}
                        <h3 className="text-4xl font-black text-[#4a4130] tracking-tight">{selectedDate}</h3>
                        {showOnlyConflicts && (
                            <span className="bg-[#fef7ec] text-[#b45d0b] text-sm font-bold px-4 py-1.5 rounded-full border border-[#fbd38d] flex items-center gap-2">
                                <WarningIcon className="w-4 h-4" />
                                تعارضات فقط
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Advanced Filtering Area */}
                <div className="bg-[#fcfbf9] border border-border rounded-[2.5rem] p-6 space-y-6 shadow-sm">
                    {/* Main Actions Row */}
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="text-sm font-black text-dark">تصفية الجلسات</h4>
                        </div>
                        <button
                            onClick={handleResetFilters}
                            className={`px-6 py-2 text-xs font-bold rounded-xl transition-all border ${
                                !selectedCircuit && !selectedPlaintiff && !selectedCaseType && !selectedCourt
                                ? 'bg-primary text-white border-transparent shadow-md'
                                : 'bg-white text-text border-border hover:bg-light'
                            }`}
                        >
                            عرض الكل ({conflictFilteredSessions.length})
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Courts Filter Column */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest opacity-60 mr-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full"></span>
                                حسب المحكمة
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableCourts.map(([name, count], index) => (
                                    <button
                                        key={`${name}-${index}`}
                                        onClick={() => {
                                            setSelectedCourt(selectedCourt === name ? null : name);
                                        }}
                                        className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                                            selectedCourt === name 
                                            ? 'bg-indigo-700 text-white border-transparent shadow-sm' 
                                            : 'bg-white text-dark/70 border-border hover:border-indigo-700/30 hover:bg-light'
                                        }`}
                                    >
                                        {name} <span className={`mr-1 opacity-50 ${selectedCourt === name ? 'text-white' : ''}`}>({count})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Circuits Filter Column */}
                        <div className="space-y-3 border-r border-border pr-4">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 mr-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                حسب الدوائر
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableCircuits.map(([name, count], index) => (
                                    <button
                                        key={`${name}-${index}`}
                                        onClick={() => {
                                            setSelectedCircuit(selectedCircuit === name ? null : name);
                                        }}
                                        className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                                            selectedCircuit === name 
                                            ? 'bg-primary text-white border-transparent shadow-sm' 
                                            : 'bg-white text-dark/70 border-border hover:border-primary/30 hover:bg-light'
                                        }`}
                                    >
                                        {name} <span className={`mr-1 opacity-50 ${selectedCircuit === name ? 'text-white' : ''}`}>({count})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Plaintiffs Filter Column */}
                        <div className="space-y-3 border-r border-border pr-6">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 mr-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                حسب المدعي
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availablePlaintiffs.map(([name, count], index) => (
                                    <button
                                        key={`${name}-${index}`}
                                        onClick={() => {
                                            setSelectedPlaintiff(selectedPlaintiff === name ? null : name);
                                        }}
                                        className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                                            selectedPlaintiff === name 
                                            ? 'bg-dark text-white border-transparent shadow-sm' 
                                            : 'bg-white text-dark/70 border-border hover:border-primary/30 hover:bg-light'
                                        }`}
                                    >
                                        {name} <span className={`mr-1 opacity-50 ${selectedPlaintiff === name ? 'text-white' : ''}`}>({count})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Case Types Filter Column */}
                        <div className="space-y-3 border-r border-border pr-6">
                            <label className="text-[10px] font-black text-[#b45d0b] uppercase tracking-widest opacity-60 mr-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#b45d0b] rounded-full"></span>
                                حسب نوع الدعوى
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableCaseTypes.map(([name, count], index) => (
                                    <button
                                        key={`${name}-${index}`}
                                        onClick={() => {
                                            setSelectedCaseType(selectedCaseType === name ? null : name);
                                        }}
                                        className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                                            selectedCaseType === name 
                                            ? 'bg-[#b45d0b] text-white border-transparent shadow-sm' 
                                            : 'bg-white text-dark/70 border-border hover:border-[#b45d0b]/30 hover:bg-light'
                                        }`}
                                    >
                                        {name} <span className={`mr-1 opacity-50 ${selectedCaseType === name ? 'text-white' : ''}`}>({count})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="mb-2 flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-bold text-text/50 italic">
                        عرض {sessionsToDisplay.length} من {conflictFilteredSessions.length} جلسة
                    </span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SessionTable 
                        sessions={sessionsToDisplay} 
                        onUpdateClick={onUpdateClick}
                        onViewClick={onViewClick}
                        conflictingSessionIds={conflictingSessionIds}
                    />
                </div>
            </div>
        </div>
    );
};

export default SessionDetails;
