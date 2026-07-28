import React, { useMemo, useState } from 'react';
import type { CaseSession } from '../types';
import { UserPlusIcon, WarningIcon, CalendarIcon, ClockIcon, BriefcaseIcon, ArrowRightIcon } from './icons';

interface LawyerReportProps {
    sessions: CaseSession[];
    onLawyerClick: (lawyerName: string, onlyConflicts: boolean) => void;
}

interface LawyerStats {
    name: string;
    totalAssignments: number;
    conflicts: {
        count: number;
        details: {
            date: string;
            time: string;
            sessions: CaseSession[];
        }[];
    };
    sessions: CaseSession[];
    caseTypesBreakdown: Record<string, number>;
}

const LawyerReport: React.FC<LawyerReportProps> = ({ sessions, onLawyerClick }) => {
    const [selectedCaseType, setSelectedCaseType] = useState<string>('all');

    const uniqueCaseTypes = useMemo(() => {
        const types = sessions.map(s => (s['نوع الدعوى'] || '').trim()).filter(Boolean);
        return Array.from(new Set(types)).sort();
    }, [sessions]);

    const lawyerData = useMemo(() => {
        const lawyers: Record<string, LawyerStats> = {};

        const filteredSessions = selectedCaseType === 'all'
            ? sessions
            : sessions.filter(s => (s['نوع الدعوى'] || '').trim() === selectedCaseType);

        filteredSessions.forEach(session => {
            const assignment = (session['التكليف'] || '').trim();
            if (!assignment) return;

            const lawyerName = assignment; 
            const caseType = (session['نوع الدعوى'] || '').trim() || 'غير محدد';

            if (!lawyers[lawyerName]) {
                lawyers[lawyerName] = {
                    name: lawyerName,
                    totalAssignments: 0,
                    conflicts: { count: 0, details: [] },
                    sessions: [],
                    caseTypesBreakdown: {}
                };
            }

            lawyers[lawyerName].totalAssignments++;
            lawyers[lawyerName].sessions.push(session);
            lawyers[lawyerName].caseTypesBreakdown[caseType] = (lawyers[lawyerName].caseTypesBreakdown[caseType] || 0) + 1;
        });

        // Detect conflicts per lawyer
        Object.values(lawyers).forEach(lawyer => {
            const dateTimeMap: Record<string, CaseSession[]> = {};
            
            lawyer.sessions.forEach(s => {
                const key = `${s['التاريخ']}_${s['وقت الموعد']}_${s['ص- م']}`;
                if (!dateTimeMap[key]) dateTimeMap[key] = [];
                dateTimeMap[key].push(s);
            });

            Object.entries(dateTimeMap).forEach(([key, sessionsAtTime]) => {
                if (sessionsAtTime.length > 1) {
                    const [date, time] = key.split('_');
                    lawyer.conflicts.count += sessionsAtTime.length;
                    lawyer.conflicts.details.push({
                        date,
                        time,
                        sessions: sessionsAtTime
                    });
                }
            });
        });

        return Object.values(lawyers).sort((a, b) => b.totalAssignments - a.totalAssignments);
    }, [sessions, selectedCaseType]);

    if (lawyerData.length === 0 && selectedCaseType === 'all') {
        return (
            <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-border">
                <div className="bg-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlusIcon className="w-10 h-10 text-border" />
                </div>
                <h3 className="text-xl font-bold text-dark">لا توجد بيانات تكليف</h3>
                <p className="text-text mt-2">قم بإضافة تكليفات للجلسات لتظهر التقارير هنا.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary mb-2">تقرير تدقيق المندوبين والمحامين (التكليف)</h2>
                    <p className="text-dark/70 text-sm">تحليل ذكي لكشف تداخل المواعيد والفرز حسب نوع الدعوى. انقر على الأرقام أدناه لفرز الجلسات.</p>
                </div>

                {uniqueCaseTypes.length > 0 && (
                    <div className="flex flex-col gap-1.5 shrink-0 bg-white/80 p-3 rounded-xl border border-primary/20">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider">فرز التكليف حسب نوع الدعوى:</label>
                        <select 
                            value={selectedCaseType}
                            onChange={(e) => setSelectedCaseType(e.target.value)}
                            className="bg-light border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-dark outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">كافة انواع الدعاوى ({uniqueCaseTypes.length})</option>
                            {uniqueCaseTypes.map((ct, index) => (
                                <option key={`${ct}-${index}`} value={ct}>{ct}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {lawyerData.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-border">
                    <h3 className="text-lg font-bold text-dark">لا توجد تكليفات لـ نوع الدعوى المحدد ({selectedCaseType})</h3>
                    <button onClick={() => setSelectedCaseType('all')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">
                        إظهار كافة أنواع الدعاوى
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {lawyerData.map((lawyer, index) => (
                        <div 
                            key={`${lawyer.name}-${index}`} 
                            className={`group bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl ${lawyer.conflicts.count > 0 ? 'border-red-100 hover:border-red-300' : 'border-transparent hover:border-primary'}`}
                        >
                            {/* Lawyer Header */}
                            <div className="p-5 border-b border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-full transition-colors ${lawyer.conflicts.count > 0 ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                        <BriefcaseIcon className="w-6 h-6" />
                                    </div>
                                    {lawyer.conflicts.count > 0 && (
                                        <span className="flex items-center bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                                            <WarningIcon className="w-3 h-3 ml-1" />
                                            تداخل مهام
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-dark mb-2">{lawyer.name}</h3>

                                {/* Case Types Breakdown Badges */}
                                {Object.keys(lawyer.caseTypesBreakdown).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {Object.entries(lawyer.caseTypesBreakdown).map(([type, count], idx) => (
                                            <span key={`${type}-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                                {type}: {count}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => onLawyerClick(lawyer.name, false)}
                                        className="text-right p-3 rounded-xl bg-light hover:bg-primary/10 transition-colors group/stat"
                                    >
                                        <p className="text-[10px] text-text uppercase font-bold opacity-60">إجمالي الجلسات</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-2xl font-black text-primary">{lawyer.totalAssignments}</p>
                                            <ArrowRightIcon className="w-4 h-4 text-primary opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => lawyer.conflicts.count > 0 && onLawyerClick(lawyer.name, true)}
                                        className={`text-right p-3 rounded-xl transition-colors group/stat ${lawyer.conflicts.count > 0 ? 'bg-red-50 hover:bg-red-100 cursor-pointer' : 'bg-gray-50 opacity-50 cursor-default'}`}
                                    >
                                        <p className="text-[10px] text-text uppercase font-bold opacity-60 flex items-center">
                                            {lawyer.conflicts.count > 0 && (
                                                <span className="relative flex h-2 w-2 ml-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            )}
                                            <span>التعارضات</span>
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-2xl font-black ${lawyer.conflicts.count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                {lawyer.conflicts.count}
                                            </p>
                                            {lawyer.conflicts.count > 0 && <ArrowRightIcon className="w-4 h-4 text-red-600 opacity-0 group-hover/stat:opacity-100 transition-opacity" />}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Status Snippet */}
                            <div className="p-4 bg-light/30 rounded-b-2xl">
                                {lawyer.conflicts.count > 0 ? (
                                    <div className="flex items-start">
                                        <WarningIcon className="w-4 h-4 text-red-500 ml-2 mt-0.5" />
                                        <p className="text-xs text-red-700 font-medium leading-relaxed">
                                            تم رصد تداخل في مواعيد هذا المحامي. انقر على رقم التعارض للمراجعة والفرز.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                        <p className="text-xs text-green-700 font-medium">جدول المواعيد منتظم ومثالي.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LawyerReport;
