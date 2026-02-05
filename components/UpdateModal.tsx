
import React, { useState } from 'react';
import type { CaseSession } from '../types';

interface UpdateModalProps {
    session: CaseSession;
    onClose: () => void;
    onUpdate: (newAssignment: string) => Promise<void>;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ session, onClose, onUpdate }) => {
    const [assignment, setAssignment] = useState(session['التكليف'] || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        await onUpdate(assignment);
        setIsUpdating(false);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg font-bold text-dark">تحديث التكليف</h3>
                    <button onClick={onClose} className="text-text opacity-75 hover:text-text">&times;</button>
                </div>
                <div className="mt-4">
                    <p className="text-sm text-text">
                        <strong>رقم الدعوى:</strong> {session['رقم الدعوى']}
                    </p>
                     <p className="text-sm text-text">
                        <strong>التاريخ:</strong> {session['التاريخ']} - {session['وقت الموعد']}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="assignment" className="block text-sm font-medium text-dark">
                            نص التكليف
                        </label>
                        <input
                            type="text"
                            id="assignment"
                            value={assignment}
                            onChange={(e) => setAssignment(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-border rounded-md shadow-sm placeholder-text opacity-50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="مثال: مكلف للمتابعة"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-light text-dark rounded-md hover:bg-border transition-colors"
                            disabled={isUpdating}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center"
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateModal;
