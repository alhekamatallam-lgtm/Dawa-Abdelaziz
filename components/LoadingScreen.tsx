import React from 'react';
import { LoadingIcon } from './icons';
import Logo from './Logo';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <Logo />
        <h1 className="text-2xl font-bold text-dark mt-4">
          مكتب المحامي عبد الله سعود آل سعد
        </h1>
        <div className="flex items-center justify-center mt-8 text-primary">
          <LoadingIcon className="w-12 h-12" />
          <p className="mr-4 text-lg">جاري تحميل البيانات الأولية...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
