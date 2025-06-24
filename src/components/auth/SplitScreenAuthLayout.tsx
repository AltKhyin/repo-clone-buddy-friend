
// ABOUTME: Provides a split-screen layout for authentication pages with forced white background.
import React from 'react';

const SplitScreenAuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl px-6">
        <div className="flex-1 flex justify-center items-center">
          <div className="w-full max-w-[400px]">
            <div className="flex flex-col">
              <h1 className="font-serif font-medium tracking-tight text-8xl text-black flex items-center">
                Reviews.
              </h1>
              <p className="text-sm mt-1 text-black opacity-80">
                - por Igor Eckert
              </p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-[350px] mt-8 md:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SplitScreenAuthLayout;
