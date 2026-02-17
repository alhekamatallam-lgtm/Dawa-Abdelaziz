
import React from 'react';
import type { CaseSession } from '../types';

interface ViewModalProps {
    session: CaseSession;
    onClose: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ session, onClose }) => {
    const details = [
        { label: 'رقم المخالفة', value: session['رقم المخالفة'] || 'لا يوجد' },
        { label: 'رقم الدعوى', value: session['رقم الدعوى'] },
        { label: 'المدعي', value: session['المدعي'] || 'غير محدد' },
        { label: 'المدعي عليه', value: session['المدعي عليه'] || 'غير محدد' },
        { label: 'المحكمة', value: session['المحكمة'] },
        { label: 'الدائرة', value: session['الدائرة'] || 'غير محددة' },
        { label: 'نوع الموعد', value: session['نوع الموعد'] },
        { label: 'وقت الموعد', value: `${session['وقت الموعد']} ${session['ص- م']}` },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black">تفاصيل الجلسة</h2>
                        <p className="text-xs opacity-80 mt-1 font-bold">بيانات القضية والموعد المختار</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {details.map((item, index) => (
                        <div key={index} className="space-y-1 group">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                                {item.label}
                            </label>
                            <p className="text-sm font-bold text-dark bg-light p-3 rounded-xl border border-transparent group-hover:border-primary/20 transition-all">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-light border-t border-border flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 bg-dark text-white rounded-xl font-bold hover:bg-primary transition-all shadow-lg active:scale-95"
                    >
                        إغلاق العرض
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewModal;
