import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-16 w-16" }) => {
    const logoUrl = "https://russeell.etqansoft.com/files/alsaad.jpg";
    
    return (
        <div className={`${className} overflow-hidden rounded-xl border-2 border-primary/20 shadow-sm`}>
            <img 
                src={logoUrl} 
                alt="شعار مكتب المحامي عبد الله سعود آل سعد" 
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default Logo;