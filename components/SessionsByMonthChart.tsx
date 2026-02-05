
import React, { useMemo } from 'react';
import type { CaseSession } from '../types';

const hijriMonths = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة",
    "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

// FIX: Define SessionsByMonthChartProps interface
interface SessionsByMonthChartProps {
    sessions: CaseSession[];
}

const SessionsByMonthChart: React.FC<SessionsByMonthChartProps> = ({ sessions }) => {
    const dataByMonth = useMemo(() => {
        const counts: { [key: number]: number } = {};
        for (let i = 1; i <= 12; i++) {
            counts[i] = 0;
        }

        sessions.forEach(session => {
            const month = session['الشهر'];
            if (month >= 1 && month <= 12) {
                counts[month]++;
            }
        });

        return Object.entries(counts).map(([month, count]) => ({
            month: Number(month),
            monthName: hijriMonths[Number(month) - 1],
            count: count,
        }));
    }, [sessions]);
    
    const totalCount = sessions.length;
    if (totalCount === 0) {
        return <div className="h-80 flex items-center justify-center text-text">لا توجد جلسات مطابقة للفلتر.</div>;
    }

    const maxCount = Math.max(...dataByMonth.map(d => d.count), 1);

    return (
        <div className="w-full h-80 flex items-end justify-between space-x-2 space-x-reverse px-4">
            {dataByMonth.map(({ month, monthName, count }) => (
                <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full h-full flex items-end">
                        <div
                            className="w-full bg-border hover:bg-primary/50 rounded-t-md transition-all"
                            style={{ height: `${(count / maxCount) * 100}%` }}
                            title={`${monthName}: ${count} جلسات`}
                        >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm font-bold text-dark">{count > 0 ? count : ''}</span>
                        </div>
                    </div>
                    <span className="mt-2 text-xs text-text whitespace-nowrap">{monthName}</span>
                </div>
            ))}
        </div>
    );
};

export default SessionsByMonthChart;