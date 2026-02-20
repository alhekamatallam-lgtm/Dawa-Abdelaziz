import React, { useState } from 'react';
import type { User } from '../types';
import { CogIcon, UserIcon, CheckBadgeIcon, BriefcaseIcon, LinkIcon } from './icons';
import { updateUserSetting } from '../services/api';

interface SettingsViewProps {
    currentUser: User;
    allUsers: User[];
    onUserUpdate: (updatedUser: User) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, allUsers, onUserUpdate }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const isAdmin = currentUser.role === 'مشرف';
    const selectedUser = isAdmin ? allUsers.find(u => u.id === selectedUserId) || currentUser : currentUser;

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword.trim()) return;

        setIsUpdating(true);
        setMessage(null);

        try {
            await updateUserSetting(selectedUserId, { pwd: newPassword });
            const updatedUser = { ...selectedUser, pwd: newPassword };
            onUserUpdate(updatedUser);
            setMessage({ type: 'success', text: `تم تحديث كلمة المرور للمستخدم ${selectedUser.name} بنجاح` });
            setNewPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث كلمة المرور' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/10 p-8 rounded-[2.5rem] border border-primary/20 flex items-center gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <CogIcon className="w-10 h-10 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-dark tracking-tight">إعدادات الحساب</h2>
                    <p className="text-dark/60 font-medium">
                        {isAdmin ? 'إدارة حسابات المستخدمين وتحديث كلمات المرور' : 'إدارة بياناتك الشخصية وتحديث كلمة المرور'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* User Info Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 bg-light rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                <UserIcon className="w-12 h-12 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-dark">{selectedUser.name}</h3>
                                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full mt-1 uppercase tracking-wider">
                                    {selectedUser.role}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-light/50 rounded-xl border border-border/50">
                                <UserIcon className="w-4 h-4 text-primary opacity-60" />
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-text/50 uppercase">اسم المستخدم</p>
                                    <p className="text-sm font-bold text-dark">{selectedUser.user}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-light/50 rounded-xl border border-border/50">
                                <CheckBadgeIcon className="w-4 h-4 text-primary opacity-60" />
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-text/50 uppercase">المعرف (ID)</p>
                                    <p className="text-sm font-bold text-dark">{selectedUser.id}</p>
                                </div>
                            </div>
                            {selectedUser.plaintiffCode && (
                                <div className="flex items-center gap-3 p-3 bg-light/50 rounded-xl border border-border/50">
                                    <LinkIcon className="w-4 h-4 text-primary opacity-60" />
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-text/50 uppercase">كود المدعي</p>
                                        <p className="text-sm font-bold text-dark">{selectedUser.plaintiffCode}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm">
                            <h4 className="text-sm font-black text-dark mb-4 border-r-4 border-primary pr-3 uppercase tracking-wider">قائمة المستخدمين</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {allUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            setSelectedUserId(u.id);
                                            setMessage(null);
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                                            selectedUserId === u.id 
                                            ? 'bg-primary text-white border-transparent shadow-md' 
                                            : 'bg-light hover:bg-border border-transparent text-dark'
                                        }`}
                                    >
                                        <div className="text-right">
                                            <p className="text-xs font-bold">{u.name}</p>
                                            <p className={`text-[10px] ${selectedUserId === u.id ? 'text-white/70' : 'text-text/50'}`}>{u.user}</p>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                            selectedUserId === u.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Update Form */}
                <div className="lg:col-span-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-border shadow-sm h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <BriefcaseIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-dark">
                                {isAdmin ? `تحديث كلمة المرور لـ ${selectedUser.name}` : 'تحديث كلمة المرور الخاصة بك'}
                            </h3>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2 mr-1">كلمة المرور الجديدة</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="أدخل كلمة المرور الجديدة..."
                                    className="w-full p-4 bg-light border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                                    required
                                />
                                <p className="text-[10px] text-text/60 mt-2 mr-1">تأكد من اختيار كلمة مرور قوية وسهلة التذكر.</p>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {message.text}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isUpdating || !newPassword.trim()}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        جاري التحديث...
                                    </>
                                ) : 'تحديث كلمة المرور'}
                            </button>
                        </form>

                        {isAdmin && (
                            <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex items-start gap-3">
                                    <CheckBadgeIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-800">تنبيه المشرف</h4>
                                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                            بصفتك مشرفاً، يمكنك تحديث كلمة المرور لأي مستخدم في النظام. يرجى التأكد من إبلاغ المستخدم بكلمة المرور الجديدة بعد التغيير.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
