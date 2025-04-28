import React from 'react';

const TitleBar: React.FC = () => {
  return (
    <header className="w-full py-4 mb-2 bg-gradient-to-r from-[#FF4D4D] via-[#4169E1] to-[#FF4D4D] relative">
      <h1 className="text-center font-arcade text-xl md:text-3xl chrome-text">VOLLEYBALL JAM</h1>
      <div className="absolute -bottom-2 left-0 w-full flex justify-center">
        <div className="bg-[#FFD700] h-1 w-4/5"></div>
      </div>
    </header>
  );
};

export default TitleBar;
