import React, { useState } from 'react';
import type { CaseSession } from '../types';

interface UpdateModalProps {
    session: CaseSession;
    onClose: () => void;
    onUpdate: (newAssignment: string) => Promise<void>;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ session, onClose, onUpdate }) => {
    const [assignment, setAssignment] = useState(session['التكليف'] || '');
    const [password, setPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // التحقق من كلمة المرور
        if (password !== 'admin123') {
            setError('كلمة المرور غير صحيحة. لا تملك صلاحية التعديل.');
            return;
        }

        setIsUpdating(true);
        try {
            await onUpdate(assignment);
        } catch (err) {
            setError('حدث خطأ أثناء التحديث. حاول مرة أخرى.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold">تحديث بيانات التكليف</h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-6">
                    {/* Session Info Box */}
                    <div className="bg-light rounded-xl p-4 mb-6 space-y-2 border border-border">
                        <div className="flex justify-between">
                            <span className="text-xs text-text opacity-70">رقم الدعوى:</span>
                            <span className="text-xs font-bold text-dark">{session['رقم الدعوى']}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-text opacity-70">الموعد:</span>
                            <span className="text-xs font-bold text-dark">{session['التاريخ']} | {session['وقت الموعد']}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-text opacity-70">الدائرة:</span>
                            <span className="text-xs font-bold text-dark">{session['الدائرة'] || 'غير محددة'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Assignment Input */}
                        <div>
                            <label htmlFor="assignment" className="block text-sm font-bold text-dark mb-1.5">
                                اسم المندوب / المحامي المكلف
                            </label>
                            <input
                                type="text"
                                id="assignment"
                                value={assignment}
                                onChange={(e) => setAssignment(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                placeholder="مثال: عبدالله محمد"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="pass" className="block text-sm font-bold text-dark mb-1.5 flex justify-between">
                                <span>كلمة المرور للمشرف</span>
                                <span className="text-[10px] font-normal text-text opacity-50">(مطلوبة للحفظ)</span>
                            </label>
                            <input
                                type="password"
                                id="pass"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError(null);
                                }}
                                className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all text-sm ${
                                    error ? 'border-red-500 focus:ring-red-100' : 'border-border focus:ring-primary/20 focus:border-primary'
                                }`}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold flex items-center animate-in fade-in slide-in-from-top-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-2">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        جاري الحفظ...
                                    </>
                                ) : 'حفظ التعديلات'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-light text-text font-bold rounded-xl hover:bg-border transition-all"
                                disabled={isUpdating}
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;