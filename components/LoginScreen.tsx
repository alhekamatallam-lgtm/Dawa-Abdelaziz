
import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { WarningIcon } from './icons';

interface LoginScreenProps {
    onLogin: (u: string, p: string, remember: boolean) => void;
    hasUsers: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, hasUsers }) => {
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // تحميل البيانات المحفوظة عند فتح الصفحة (اختياري لملء الحقول)
    useEffect(() => {
        const savedU = localStorage.getItem('alsaad_user');
        const savedP = localStorage.getItem('alsaad_pwd');
        if (savedU && savedP) {
            setU(savedU);
            setP(savedP);
            setRememberMe(true);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onLogin(u, p, rememberMe);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-border text-center animate-in fade-in zoom-in duration-300">
                <Logo className="mx-auto mb-4 h-24 w-24" />
                <h1 className="text-2xl font-bold text-dark mb-1">تسجيل الدخول</h1>
                <p className="text-text text-sm mb-6 font-medium">نظام إدارة مكتب المحامي آل سعد</p>
                
                {!hasUsers && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-right animate-pulse">
                        <WarningIcon className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-[11px] text-red-700 font-bold">عذراً، لم نتمكن من العثور على بيانات المستخدمين في السيرفر.</span>
                    </div>
                )}

                <div className="space-y-4 text-right">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text mr-1">اسم المستخدم</label>
                        <input 
                            type="text" 
                            placeholder="اسم المستخدم" 
                            value={u} 
                            onChange={e => setU(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full p-3 bg-light border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text mr-1">كلمة المرور</label>
                        <input 
                            type="password" 
                            placeholder="كلمة المرور" 
                            value={p} 
                            onChange={e => setP(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full p-3 bg-light border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                        />
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center gap-2 mt-2 px-1">
                        <input 
                            type="checkbox" 
                            id="remember" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                        <label htmlFor="remember" className="text-xs font-bold text-text/80 cursor-pointer select-none">
                            تذكر بيانات الدخول
                        </label>
                    </div>

                    <button 
                        onClick={() => onLogin(u, p, rememberMe)} 
                        disabled={!hasUsers}
                        className={`w-full p-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 mt-4 ${
                            hasUsers 
                            ? 'bg-primary text-white hover:bg-dark shadow-primary/20' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        دخول للنظام
                    </button>
                </div>
                <p className="mt-8 text-[10px] text-text opacity-40 font-bold uppercase tracking-widest">جميع الحقوق محفوظة © ٢٠٢٤</p>
            </div>
        </div>
    );
};

export default LoginScreen;
