
import React, { useMemo } from 'react';
import type { CaseSession } from '../types';

interface SessionsByCourtChartProps {
    sessions: CaseSession[];
}

const colors = [
    'bg-primary',
    'bg-dark',
    'bg-[#c7b89d]',
    'bg-[#7a8c7f]',
    'bg-[#7f8c8d]',
    'bg-text',
];

const SessionsByCourtChart: React.FC<SessionsByCourtChartProps> = ({ sessions }) => {
    const dataByCourt = useMemo(() => {
        const counts = new Map<string, number>();
        sessions.forEach(session => {
            const court = session['المحكمة'];
            counts.set(court, (counts.get(court) || 0) + 1);
        });

        const sortedData = [...counts.entries()]
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([court, count], index) => ({
                court,
                count,
                percentage: (count / sessions.length) * 100,
                color: colors[index % colors.length],
            }));
        
        return sortedData;

    }, [sessions]);
    
    if (sessions.length === 0) {
        return <p className="text-text text-center py-4">لا توجد بيانات لعرضها.</p>;
    }

    return (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {dataByCourt.map(({ court, count, percentage, color }) => (
                <div key={court}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-dark">{court}</span>
                        <span className="text-sm font-bold text-text">{count}</span>
                    </div>
                    <div className="w-full bg-light rounded-full h-2.5">
                        <div
                            className={`${color} h-2.5 rounded-full`}
                            style={{ width: `${percentage}%` }}
                            title={`${percentage.toFixed(1)}%`}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SessionsByCourtChart;
