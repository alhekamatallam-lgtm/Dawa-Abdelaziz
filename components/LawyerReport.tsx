import React, { useMemo } from 'react';
import type { CaseSession } from '../types';
import { UserPlusIcon, WarningIcon, CalendarIcon, ClockIcon, BriefcaseIcon, ArrowRightIcon } from './icons';

interface LawyerReportProps {
    sessions: CaseSession[];
    onLawyerClick: (lawyerName: string, onlyConflicts?: boolean) => void;
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
}

const LawyerReport: React.FC<LawyerReportProps> = ({ sessions, onLawyerClick }) => {
    const lawyerData = useMemo(() => {
        const lawyers: Record<string, LawyerStats> = {};

        sessions.forEach(session => {
            const assignment = (session['التكليف'] || '').trim();
            if (!assignment) return;

            const lawyerName = assignment; 

            if (!lawyers[lawyerName]) {
                lawyers[lawyerName] = {
                    name: lawyerName,
                    totalAssignments: 0,
                    conflicts: { count: 0, details: [] },
                    sessions: []
                };
            }

            lawyers[lawyerName].totalAssignments++;
            lawyers[lawyerName].sessions.push(session);
        });

        // Detect conflicts per lawyer
        Object.values(lawyers).forEach(lawyer => {
            const dateTimeMap: Record<string, CaseSession[]> = {};
            
            lawyer.sessions.forEach(s => {
                const key = `${s['التاريخ']}_${s['وقت الموعد']}`;
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
    }, [sessions]);

    if (lawyerData.length === 0) {
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
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
                <h2 className="text-2xl font-bold text-primary mb-2">تقرير تدقيق المندوبين والمحامين</h2>
                <p className="text-dark/70 text-sm">تحليل ذكي لكشف تداخل المواعيد. انقر على الأرقام أدناه لفرز الجلسات (الكل أو التعارضات فقط).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {lawyerData.map(lawyer => (
                    <div 
                        key={lawyer.name} 
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
                            <h3 className="text-lg font-bold text-dark mb-4">{lawyer.name}</h3>
                            
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
                                    <p className="text-[10px] text-text uppercase font-bold opacity-60">التعارضات</p>
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
        </div>
    );
};

export default LawyerReport;