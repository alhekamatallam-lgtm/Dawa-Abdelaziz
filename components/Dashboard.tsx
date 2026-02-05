
import React, { useMemo, useState } from 'react';
import type { CaseSession } from '../types';
import StatCard from './StatCard';
import SessionsByMonthChart from './SessionsByMonthChart';
import SessionsByCourtChart from './SessionsByCourtChart';
import { BriefcaseIcon, AlertTriangleIcon, UserPlusIcon, ClipboardDocumentListIcon } from './icons';

interface DashboardProps {
    sessions: CaseSession[];
}

const Dashboard: React.FC<DashboardProps> = ({ sessions }) => {
    const [filter, setFilter] = useState<'all' | 'conflicts' | 'assigned' | 'unassigned'>('all');

    const { stats, conflictingSessions } = useMemo(() => {
        const totalSessions = sessions.length;
        const unassignedCount = sessions.filter(s => !s['التكليف'] || s['التكليف'].trim() === '').length;
        
        const timeMap = new Map<string, Map<string, CaseSession[]>>();
        sessions.forEach(session => {
            const date = session['التاريخ'];
            const time = session['وقت الموعد'];
            if (!timeMap.has(date)) {
                timeMap.set(date, new Map<string, CaseSession[]>());
            }
            if (!timeMap.get(date)!.has(time)) {
                timeMap.get(date)!.set(time, []);
            }
            timeMap.get(date)!.get(time)!.push(session);
        });

        const conflictingSessionsList: CaseSession[] = [];
        timeMap.forEach(dateMap => {
            dateMap.forEach(sessionsAtTime => {
                if (sessionsAtTime.length > 1) {
                    conflictingSessionsList.push(...sessionsAtTime);
                }
            });
        });
        
        const assignedCount = totalSessions - unassignedCount;

        const uniqueConflictIds = new Set(conflictingSessionsList.map(s => s.id));
        const conflictCount = uniqueConflictIds.size;

        return { 
            stats: { totalSessions, unassignedCount, conflictCount, assignedCount },
            conflictingSessions: conflictingSessionsList
        };
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        switch (filter) {
            case 'assigned':
                return sessions.filter(s => s['التكليف'] && s['التكليف'].trim() !== '');
            case 'unassigned':
                return sessions.filter(s => !s['التكليف'] || s['التكليف'].trim() === '');
            case 'conflicts':
                return conflictingSessions;
            case 'all':
            default:
                return sessions;
        }
    }, [filter, sessions, conflictingSessions]);

    const filterTitles = {
        all: 'نظرة عامة على جميع الجلسات',
        conflicts: 'تحليل الجلسات المتعارضة',
        assigned: 'تحليل الجلسات المكلفة',
        unassigned: 'تحليل الجلسات غير المكلفة',
    };

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="إجمالي الجلسات" 
                    value={stats.totalSessions} 
                    icon={<ClipboardDocumentListIcon className="w-8 h-8" />} 
                    onClick={() => setFilter('all')}
                    isActive={filter === 'all'}
                />
                <StatCard 
                    title="جلسات متعارضة" 
                    value={stats.conflictCount} 
                    icon={<AlertTriangleIcon className="w-8 h-8" />} 
                    color="amber" 
                    onClick={() => setFilter('conflicts')}
                    isActive={filter === 'conflicts'}
                />
                <StatCard 
                    title="تم تكليفها" 
                    value={stats.assignedCount} 
                    icon={<UserPlusIcon className="w-8 h-8" />} 
                    color="green"
                    onClick={() => setFilter('assigned')}
                    isActive={filter === 'assigned'}
                />
                <StatCard 
                    title="لم يتم تكليفها" 
                    value={stats.unassignedCount} 
                    icon={<BriefcaseIcon className="w-8 h-8" />} 
                    color="red" 
                    onClick={() => setFilter('unassigned')}
                    isActive={filter === 'unassigned'}
                />
            </div>

            {/* Charts Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold mb-6 text-dark border-r-4 border-primary pr-4">
                    {filterTitles[filter]}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <h4 className="text-lg font-semibold mb-4 text-dark">الجلسات حسب الشهر</h4>
                        <SessionsByMonthChart sessions={filteredSessions} />
                    </div>
                    <div className="lg:col-span-2">
                        <h4 className="text-lg font-semibold mb-4 text-dark">توزيع الجلسات على المحاكم</h4>
                        <SessionsByCourtChart sessions={filteredSessions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
