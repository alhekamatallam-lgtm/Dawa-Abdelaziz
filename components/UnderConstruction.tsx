import React from 'react';
import Logo from './Logo';
import { WrenchScrewdriverIcon } from './icons';

const UnderConstruction: React.FC = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-md">
        <Logo />
        <div className="flex items-center justify-center mt-8 mb-4">
          <WrenchScrewdriverIcon className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-2">
          الصفحة قيد الإنشاء
        </h1>
        <p className="text-lg text-text opacity-90">
          نعمل حالياً على تطوير وتحسين هذه الصفحة لتقديم أفضل تجربة لكم.
        </p>
        <p className="text-lg text-text opacity-90 mt-2">
          شكراً لصبركم وتفهمكم.
        </p>
      </div>
    </div>
  );
};

export default UnderConstruction;
