
import React, { useState } from 'react';
import type { CaseSession } from '../types';

interface UpdateModalProps {
    session: CaseSession;
    onClose: () => void;
    onUpdate: (updates: Partial<CaseSession>) => Promise<void>;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ session, onClose, onUpdate }) => {
    const [assignment, setAssignment] = useState(session['التكليف'] || '');
    const [attendance, setAttendance] = useState(session['حضور الجلسة'] || '');
    const [minutes, setMinutes] = useState(session['محضر الجلسة'] || '');
    const [caseStatus, setCaseStatus] = useState(session['حالة_الدعوى'] || '');
    const [reason, setReason] = useState(session['السبب'] || '');
    const [addPrecedent, setAddPrecedent] = useState(session['اضافة_السوابق_القضائية'] === 'نعم');
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (attendance === 'حضرت' && !minutes.trim()) {
            setError('يجب تعبئة محضر الجلسة عند اختيار حالة "حضرت".');
            return;
        }

        if (caseStatus && !reason.trim()) {
            setError('يجب ذكر السبب عند اختيار حالة للدعوى.');
            return;
        }

        setIsUpdating(true);
        try {
            await onUpdate({
                "التكليف": assignment,
                "حضور الجلسة": attendance,
                "محضر الجلسة": attendance === 'حضرت' ? minutes : '',
                "حالة_الدعوى": caseStatus,
                "السبب": reason,
                "اضافة_السوابق_القضائية": addPrecedent ? 'نعم' : 'لا'
            });
        } catch (err) {
            setError('حدث خطأ أثناء التحديث.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="bg-primary p-4 text-white font-bold">تحديث الجلسة</div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">المكلف بالجلسة</label>
                        <input type="text" value={assignment} onChange={e => setAssignment(e.target.value)} className="w-full p-2 border rounded-lg bg-light" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">حضور الجلسة</label>
                        <select value={attendance} onChange={e => setAttendance(e.target.value)} className="w-full p-2 border rounded-lg">
                            <option value="">-- اختر الحالة --</option>
                            <option value="حضرت">حضرت</option>
                            <option value="لم أحضر">لم أحضر</option>
                        </select>
                    </div>
                    {attendance === 'حضرت' && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">محضر الجلسة (إلزامي)</label>
                                <textarea value={minutes} onChange={e => setMinutes(e.target.value)} className="w-full p-2 border rounded-lg h-24" placeholder="ماذا حدث في الجلسة؟" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">حالة الدعوى</label>
                                <select value={caseStatus} onChange={e => setCaseStatus(e.target.value)} className="w-full p-2 border rounded-lg">
                                    <option value="">-- اختر حالة الدعوى --</option>
                                    <option value="رفض الدعوى">رفض الدعوى</option>
                                    <option value="عدم القبول">عدم القبول</option>
                                    <option value="تأجيل الجلسة">تأجيل الجلسة</option>
                                    <option value="إلغاء القرار">إلغاء القرار</option>
                                </select>
                            </div>
                            {caseStatus && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold mb-1">السبب (إلزامي)</label>
                                    <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="اكتب السبب هنا..." required />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="addPrecedent" 
                            checked={addPrecedent} 
                            onChange={e => setAddPrecedent(e.target.checked)}
                            className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                        <label htmlFor="addPrecedent" className="text-sm font-bold cursor-pointer select-none">إضافة السوابق القضائية</label>
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <div className="flex gap-2 pt-4">
                        <button type="submit" disabled={isUpdating} className="flex-1 bg-primary text-white p-2 rounded-lg font-bold">{isUpdating ? 'جاري الحفظ...' : 'حفظ'}</button>
                        <button type="button" onClick={onClose} className="bg-light p-2 rounded-lg font-bold">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateModal;
