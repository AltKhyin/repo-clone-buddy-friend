
// ABOUTME: Provides a split-screen layout for authentication pages with forced white background.
import React from 'react';

const SplitScreenAuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl px-4 md:px-6 py-8">
        <div className="flex-1 flex justify-center items-center mb-8 md:mb-0">
          <div className="w-full max-w-[350px] px-4 md:px-0">
            <div className="flex flex-col text-center md:text-left">
              <h1 className="font-serif font-medium tracking-tight text-6xl sm:text-7xl md:text-8xl text-black flex items-center justify-center md:justify-start">
                Reviews.
              </h1>
              <p className="text-sm mt-1 text-black opacity-80">
                - por Igor Eckert
              </p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-[350px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SplitScreenAuthLayout;
