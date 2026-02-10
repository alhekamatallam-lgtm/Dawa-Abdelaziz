import React, { useMemo } from 'react';
import type { CaseSession } from '../types';
import { UserGroupIcon, WarningIcon, ArrowRightIcon } from './icons';

interface PlaintiffReportProps {
    sessions: CaseSession[];
    onPlaintiffClick: (plaintiffName: string, onlyConflicts?: boolean) => void;
}

interface PlaintiffStats {
    name: string;
    totalCases: number;
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

const PlaintiffReport: React.FC<PlaintiffReportProps> = ({ sessions, onPlaintiffClick }) => {
    const plaintiffData = useMemo(() => {
        const plaintiffs: Record<string, PlaintiffStats> = {};

        sessions.forEach(session => {
            const plaintiffName = (session['المدعي'] || '').trim();
            if (!plaintiffName) return;

            if (!plaintiffs[plaintiffName]) {
                plaintiffs[plaintiffName] = {
                    name: plaintiffName,
                    totalCases: 0,
                    conflicts: { count: 0, details: [] },
                    sessions: []
                };
            }

            plaintiffs[plaintiffName].totalCases++;
            plaintiffs[plaintiffName].sessions.push(session);
        });

        Object.values(plaintiffs).forEach(plaintiff => {
            const dateTimeMap: Record<string, CaseSession[]> = {};
            
            plaintiff.sessions.forEach(s => {
                const key = `${s['التاريخ']}_${s['وقت الموعد']}_${s['ص- م']}`;
                if (!dateTimeMap[key]) dateTimeMap[key] = [];
                dateTimeMap[key].push(s);
            });

            Object.entries(dateTimeMap).forEach(([key, sessionsAtTime]) => {
                if (sessionsAtTime.length > 1) {
                    const [date, time] = key.split('_');
                    plaintiff.conflicts.count += sessionsAtTime.length;
                    plaintiff.conflicts.details.push({
                        date,
                        time,
                        sessions: sessionsAtTime
                    });
                }
            });
        });

        return Object.values(plaintiffs).sort((a, b) => b.totalCases - a.totalCases);
    }, [sessions]);

    if (plaintiffData.length === 0) {
        return (
            <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-border">
                <div className="bg-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="w-10 h-10 text-border" />
                </div>
                <h3 className="text-xl font-bold text-dark">لا توجد بيانات للمدعين</h3>
                <p className="text-text mt-2">لا توجد قضايا مسجلة بأسماء مدعين في النظام حالياً.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
                <h2 className="text-2xl font-bold text-primary mb-2">تقرير قضايا المدعين</h2>
                <p className="text-dark/70 text-sm">نظرة شاملة على القضايا المرفوعة من كل مدعي. انقر لعرض التفاصيل.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plaintiffData.map(plaintiff => (
                    <div 
                        key={plaintiff.name} 
                        className={`group bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl ${plaintiff.conflicts.count > 0 ? 'border-red-100 hover:border-red-300' : 'border-transparent hover:border-primary'}`}
                    >
                        <div className="p-5 border-b border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-full transition-colors ${plaintiff.conflicts.count > 0 ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                    <UserGroupIcon className="w-6 h-6" />
                                </div>
                                {plaintiff.conflicts.count > 0 && (
                                    <span className="flex items-center bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                                        <WarningIcon className="w-3 h-3 ml-1" />
                                        تداخل مواعيد
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-dark mb-4">{plaintiff.name}</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => onPlaintiffClick(plaintiff.name, false)}
                                    className="text-right p-3 rounded-xl bg-light hover:bg-primary/10 transition-colors group/stat"
                                >
                                    <p className="text-[10px] text-text uppercase font-bold opacity-60">إجمالي القضايا</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-black text-primary">{plaintiff.totalCases}</p>
                                        <ArrowRightIcon className="w-4 h-4 text-primary opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => plaintiff.conflicts.count > 0 && onPlaintiffClick(plaintiff.name, true)}
                                    className={`text-right p-3 rounded-xl transition-colors group/stat ${plaintiff.conflicts.count > 0 ? 'bg-red-50 hover:bg-red-100 cursor-pointer' : 'bg-gray-50 opacity-50 cursor-default'}`}
                                >
                                    <p className="text-[10px] text-text uppercase font-bold opacity-60">مواعيد متعارضة</p>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-2xl font-black ${plaintiff.conflicts.count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                            {plaintiff.conflicts.count}
                                        </p>
                                        {plaintiff.conflicts.count > 0 && <ArrowRightIcon className="w-4 h-4 text-red-600 opacity-0 group-hover/stat:opacity-100 transition-opacity" />}
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-light/30 rounded-b-2xl">
                            {plaintiff.conflicts.count > 0 ? (
                                <div className="flex items-start">
                                    <WarningIcon className="w-4 h-4 text-red-500 ml-2 mt-0.5" />
                                    <p className="text-xs text-red-700 font-medium leading-relaxed">
                                        تم رصد تداخل في مواعيد جلسات هذا المدعي. انقر على رقم التعارض للمراجعة.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                    <p className="text-xs text-green-700 font-medium">لا توجد تعارضات في مواعيد الجلسات.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlaintiffReport;