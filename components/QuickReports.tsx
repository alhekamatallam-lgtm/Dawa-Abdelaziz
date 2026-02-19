import React, { useMemo } from 'react';
import type { CaseSession } from '../types';
import { CheckBadgeIcon, AlertTriangleIcon, DocumentDuplicateIcon, ArrowRightIcon } from './icons';

interface QuickReportsProps {
    sessions: CaseSession[];
    onNavigate: (filters: { special: 'correctly_linked' | 'unlinked' | 'duplicates' }) => void;
}

const QuickReports: React.FC<QuickReportsProps> = ({ sessions, onNavigate }) => {

    const { correctlyLinkedCount, unlinkedCount, duplicateCount } = useMemo(() => {
        if (!sessions || sessions.length === 0) {
            return { correctlyLinkedCount: 0, unlinkedCount: 0, duplicateCount: 0 };
        }

        const caseNumberCounts = new Map<string, number[]>();
        const violationNumberCounts = new Map<string, number[]>();

        sessions.forEach(s => {
            const caseNum = String(s['رقم الدعوى'] || '').trim();
            if (caseNum) {
                if (!caseNumberCounts.has(caseNum)) caseNumberCounts.set(caseNum, []);
                caseNumberCounts.get(caseNum)!.push(s.id);
            }

            const violationNum = String(s['رقم المخالفة'] || '').trim();
            if (violationNum) {
                if (!violationNumberCounts.has(violationNum)) violationNumberCounts.set(violationNum, []);
                violationNumberCounts.get(violationNum)!.push(s.id);
            }
        });

        const duplicateIds = new Set<number>();
        caseNumberCounts.forEach(ids => {
            if (ids.length > 1) ids.forEach(id => duplicateIds.add(id));
        });
        violationNumberCounts.forEach(ids => {
            if (ids.length > 1) ids.forEach(id => duplicateIds.add(id));
        });

        const unlinkedSessions = sessions.filter(s =>
            (!!s['رقم الدعوى'] && !s['رقم المخالفة']) ||
            (!s['رقم الدعوى'] && !!s['رقم المخالفة'])
        );
        
        const correctlyLinkedSessions = sessions.filter(s =>
            !!s['رقم الدعوى'] && !!s['رقم المخالفة'] && !duplicateIds.has(s.id)
        );

        return { 
            correctlyLinkedCount: correctlyLinkedSessions.length,
            unlinkedCount: unlinkedSessions.length,
            duplicateCount: duplicateIds.size,
        };
    }, [sessions]);

    const reports = [
        {
            title: "جلسات صحيحة ومكتملة",
            count: correctlyLinkedCount,
            description: "جلسات مرتبطة برقم دعوى ورقم مخالفة فريدين. هذه هي البيانات المثالية.",
            icon: <CheckBadgeIcon className="w-8 h-8 text-green-600" />,
            color: "green",
            filter: "correctly_linked"
        },
        {
            title: "جلسات غير مرتبطة",
            count: unlinkedCount,
            description: "جلسات لها رقم دعوى بدون رقم مخالفة، أو العكس. يجب مراجعتها لربط البيانات.",
            icon: <AlertTriangleIcon className="w-8 h-8 text-amber-600" />,
            color: "amber",
            filter: "unlinked"
        },
        {
            title: "جلسات بياناتها مكررة",
            count: duplicateCount,
            description: "جلسات يتكرر فيها رقم الدعوى أو رقم المخالفة مع جلسات أخرى، مما قد يسبب أخطاء.",
            icon: <DocumentDuplicateIcon className="w-8 h-8 text-red-600" />,
            color: "red",
            filter: "duplicates"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
                <h2 className="text-2xl font-bold text-primary mb-2">تقارير جودة البيانات</h2>
                <p className="text-dark/70 text-sm">أدوات سريعة لفحص وتدقيق صحة البيانات المسجلة في النظام. انقر على أي تقرير للانتقال إلى قائمة مفلترة.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <div key={report.title} className={`bg-white rounded-2xl shadow-sm border flex flex-col justify-between p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
                        <div>
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-full bg-${report.color}-50`}>
                                    {report.icon}
                                </div>
                                <span className={`text-4xl font-black text-${report.color}-500`}>
                                    {report.count}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-dark mt-4">{report.title}</h3>
                            <p className="text-xs text-text/80 mt-2 leading-relaxed">{report.description}</p>
                        </div>
                        <button
                            onClick={() => onNavigate({ special: report.filter as any })}
                            className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm bg-${report.color}-500 text-white hover:bg-${report.color}-600`}
                        >
                            <span>عرض الجلسات ({report.count})</span>
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuickReports;
