import React, { useMemo } from 'react';
import type { CaseSession } from '../types';
import { ArrowRightIcon, CheckBadgeIcon, WarningIcon, ClockIcon, BriefcaseIcon, UserIcon } from './icons';

interface QualityResultsViewProps {
    sessions: CaseSession[];
    filterType: 'correctly_linked' | 'unlinked' | 'duplicates';
    onBack: () => void;
    onViewClick: (session: CaseSession) => void;
}

const QualityResultsView: React.FC<QualityResultsViewProps> = ({ sessions, filterType, onBack, onViewClick }) => {
    
    const filteredSessions = useMemo(() => {
        const duplicateMap = new Map<string, number[]>();
        
        sessions.forEach(s => {
            const sessionNum = String(s['رقم الدعوى'] || '').trim();
            const violationNum = String(s['رقم المخالفة'] || '').trim();
            const date = String(s['التاريخ'] || '').trim();
            
            if (sessionNum && violationNum && date) {
                const key = `${sessionNum}_${violationNum}_${date}`;
                if (!duplicateMap.has(key)) duplicateMap.set(key, []);
                duplicateMap.get(key)!.push(s.id);
            }
        });

        const duplicateIds = new Set<number>();
        duplicateMap.forEach(ids => { if (ids.length > 1) ids.forEach(id => duplicateIds.add(id)); });

        if (filterType === 'duplicates') return sessions.filter(s => duplicateIds.has(s.id));
        if (filterType === 'unlinked') return sessions.filter(s => (!!s['رقم الدعوى'] && !s['رقم المخالفة']) || (!s['رقم الدعوى'] && !!s['رقم المخالفة']));
        if (filterType === 'correctly_linked') return sessions.filter(s => !!s['رقم الدعوى'] && !!s['رقم المخالفة'] && !duplicateIds.has(s.id));
        
        return [];
    }, [sessions, filterType]);

    const config = {
        correctly_linked: { title: 'الجلسات الصحيحة والمكتملة', icon: <CheckBadgeIcon className="w-6 h-6 text-green-600" />, color: 'green' },
        unlinked: { title: 'الجلسات غير المرتبطة', icon: <WarningIcon className="w-6 h-6 text-amber-600" />, color: 'amber' },
        duplicates: { title: 'الجلسات المكررة', icon: <WarningIcon className="w-6 h-6 text-red-600" />, color: 'red' }
    }[filterType] || { title: 'نتائج الجودة', icon: <WarningIcon className="w-6 h-6 text-gray-600" />, color: 'gray' };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 hover:bg-light rounded-full transition-colors text-primary"
                    >
                        <ArrowRightIcon className="w-6 h-6 rotate-180" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            {config.icon}
                            <h2 className="text-2xl font-bold text-dark">{config.title}</h2>
                        </div>
                        <p className="text-sm text-text opacity-70 mt-1">عرض قائمة الجلسات بناءً على معايير الجودة المحددة.</p>
                    </div>
                </div>
                <div className={`bg-${config.color}-50 text-${config.color}-700 px-4 py-2 rounded-xl font-bold border border-${config.color}-100`}>
                    {filteredSessions.length} جلسة
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredSessions.map((session, index) => {
                    const isNoShow = session['حضور الجلسة'] === 'لم أحضر';
                    return (
                        <div 
                            key={`${session.id}-${index}`}
                            onClick={() => onViewClick(session)}
                            className={`${isNoShow ? 'bg-red-50/50 border-red-200' : 'bg-white border-border'} border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
                        >
                            <div className={`absolute right-0 top-0 w-1 h-full ${isNoShow ? 'bg-red-500' : `bg-${config.color}-500`}`}></div>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold bg-light px-2 py-1 rounded text-primary">#{session.id}</span>
                                        <h4 className="font-bold text-dark text-lg">{session['رقم الدعوى'] || 'بدون رقم دعوى'}</h4>
                                        {session['رقم المخالفة'] && (
                                            <span className="text-xs bg-primary/5 text-primary px-2 py-1 rounded border border-primary/10">مخالفة: {session['رقم المخالفة']}</span>
                                        )}
                                        {isNoShow && (
                                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                                                <span className="w-1 h-1 bg-white rounded-full"></span>
                                                لم أحضر
                                            </span>
                                        )}
                                    </div>
                                
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6">
                                        <div className="flex items-center gap-2 text-xs text-text">
                                            <ClockIcon className="w-4 h-4 opacity-50" />
                                            <span>{session['التاريخ']} - {session['وقت الموعد']} {session['ص- م']}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text">
                                            <BriefcaseIcon className="w-4 h-4 opacity-50" />
                                            <span className="truncate">{session['التكليف'] || 'غير مكلف'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text">
                                            <UserIcon className="w-4 h-4 opacity-50" />
                                            <span className="truncate">{session['المدعي'] || 'غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text">
                                            <CheckBadgeIcon className="w-4 h-4 opacity-50" />
                                            <span className="truncate">{session['الدائرة'] || 'بدون دائرة'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 self-end md:self-center">
                                    <div className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                        <span>تفاصيل</span>
                                        <ArrowRightIcon className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredSessions.length === 0 && (
                    <div className="py-20 text-center bg-light/30 rounded-2xl border-2 border-dashed border-border">
                        <p className="text-text opacity-50 font-bold">لا توجد جلسات في هذه القائمة حالياً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QualityResultsView;
