import React from 'react';
import { CalendarIcon, ClipboardDocumentListIcon, ClockIcon } from './icons';

// FIX: Change component signature to React.FC to correctly handle the 'key' prop in lists.
const SkeletonBase: React.FC<{ className?: string }> = ({ className = '' }) => <div className={`bg-border rounded ${className} animate-pulse`}></div>;

export const CalendarViewSkeleton: React.FC = () => (
    <div className="bg-white p-4 rounded-lg shadow-md h-full">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
                <CalendarIcon className="w-6 h-6 text-border" />
                <SkeletonBase className="h-6 w-32 mr-2" />
            </div>
            <SkeletonBase className="h-8 w-28" />
        </div>
        <div className="space-y-2 pr-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-full p-3 rounded-md bg-light flex justify-between items-center">
                    <SkeletonBase className="h-4 w-1/4" />
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <SkeletonBase className="h-5 w-16 rounded-full" />
                        <SkeletonBase className="h-5 w-16 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// FIX: Change component signature to React.FC to correctly handle the 'key' prop in lists.
const SkeletonTableRow: React.FC<{ showDate?: boolean }> = ({ showDate }) => (
    <tr>
        {showDate && <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><SkeletonBase className="h-4 w-24" /></td>}
        <td className="px-6 py-4 whitespace-nowrap"><SkeletonBase className="h-4 w-20" /></td>
        <td className="px-6 py-4 whitespace-nowrap"><SkeletonBase className="h-4 w-16" /></td>
        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><SkeletonBase className="h-4 w-32" /></td>
        <td className="px-6 py-4 whitespace-nowrap"><SkeletonBase className="h-4 w-12" /></td>
        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><SkeletonBase className="h-4 w-24" /></td>
        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><SkeletonBase className="h-4 w-28" /></td>
        <td className="px-6 py-4 whitespace-nowrap"><SkeletonBase className="h-9 w-9 rounded-full" /></td>
    </tr>
);

const SkeletonTable = ({ showDate = false }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
            <thead className="bg-light">
                <tr>
                    {showDate && <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">التاريخ</th>}
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text">وقت الموعد</th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text">رقم الدعوى</th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">المحكمة</th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text">الدائرة</th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">نوع الموعد</th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">التكليف</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">تعديل</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} showDate={showDate} />)}
            </tbody>
        </table>
    </div>
);


export const SessionDetailsSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
        <ClockIcon className="w-16 h-16 text-border" />
        <h3 className="text-xl font-bold mt-4 text-dark">اختر يوماً من القائمة</h3>
        <p className="text-text opacity-75 mt-2">لعرض تفاصيل الجلسات أو المواعيد المتعارضة.</p>
    </div>
);

export const CalendarPageSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <CalendarViewSkeleton />
        </div>
        <div className="lg:col-span-2">
            <SessionDetailsSkeleton />
        </div>
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg flex items-center space-x-4 space-x-reverse shadow-md">
                    <SkeletonBase className="w-16 h-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBase className="h-4 w-1/2" />
                        <SkeletonBase className="h-8 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <SkeletonBase className="h-7 w-1/3 mb-6" />
            <div className="space-y-8">
                <div>
                    <SkeletonBase className="h-6 w-1/4 mb-4" />
                    <SkeletonBase className="h-80 w-full" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <SkeletonBase className="h-6 w-1/3 mb-4" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => <SkeletonBase key={i} className="h-10 w-full" />)}
                        </div>
                    </div>
                    <div>
                        <SkeletonBase className="h-6 w-1/3 mb-4" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => <SkeletonBase key={i} className="h-10 w-full" />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


export const AssignmentsViewSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4 border-b pb-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-border" />
            <SkeletonBase className="h-8 w-48 mr-3" />
        </div>
        <SkeletonBase className="h-4 w-3/4 mb-2" />
        <SkeletonBase className="h-4 w-1/2 mb-6" />
        <SkeletonTable showDate={true} />
    </div>
);
