import React from 'react';

const ShootingStars = ({ className = "", dense = false }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Shooting Star 1 - Diagonal Up (left to right, up) */}
      <div className="absolute top-1/4 left-0 animate-shooting-star-1 opacity-60" style={{ animationDelay: '0s' }}>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-cyan-400 rotate-[-15deg] origin-left shadow-lg shadow-cyan-400/30"></div>
      </div>
      
      {/* Shooting Star 2 - Diagonal Down (right to left, down) */}
      <div className="absolute top-1/3 right-0 animate-shooting-star-2 opacity-50" style={{ animationDelay: '0.5s' }}>
        <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-blue-400 rotate-[165deg] origin-right shadow-lg shadow-blue-400/30"></div>
      </div>
      
      {/* Shooting Star 3 - Steep Diagonal */}
      <div className="absolute bottom-1/4 left-1/4 animate-shooting-star-3 opacity-40" style={{ animationDelay: '1s' }}>
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-purple-400 rotate-[45deg] origin-left shadow-lg shadow-purple-400/30"></div>
      </div>
      
      {/* Shooting Star 4 - Steep Diagonal Reverse */}
      <div className="absolute top-1/2 right-1/3 animate-shooting-star-4 opacity-30" style={{ animationDelay: '1.5s' }}>
        <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-200 to-cyan-300 rotate-[-135deg] origin-right shadow-lg shadow-cyan-300/30"></div>
      </div>
      
      {/* Additional shooting stars for more dynamic effect */}
      <div className="absolute top-1/6 right-1/4 animate-shooting-star-5 opacity-50" style={{ animationDelay: '0.3s' }}>
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-cyan-400 rotate-[-10deg] origin-left shadow-lg shadow-cyan-400/25"></div>
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-shooting-star-6 opacity-45" style={{ animationDelay: '2s' }}>
        <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-blue-400 rotate-[170deg] origin-right shadow-lg shadow-blue-400/25"></div>
      </div>
      {dense && (
        <>
          <div className="absolute top-2/5 left-1/6 animate-shooting-star-7 opacity-40" style={{ animationDelay: '0.8s' }}>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-violet-300 to-purple-400 rotate-[35deg] origin-left shadow-lg shadow-purple-400/20"></div>
          </div>
          <div className="absolute top-3/4 right-1/6 animate-shooting-star-8 opacity-35" style={{ animationDelay: '2.5s' }}>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-sky-300 to-cyan-400 rotate-[-140deg] origin-right shadow-lg shadow-cyan-400/20"></div>
          </div>
        </>
      )}
      
      {/* Floating Particles with enhanced fade-in/fade-out animations */}
      <div className="absolute top-1/6 left-1/6 w-1 h-1 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full animate-float-slow animate-pulse-fade shadow-sm shadow-cyan-400/30"></div>
      <div className="absolute top-2/3 right-1/4 w-0.5 h-0.5 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full animate-float-slower animate-pulse-fade shadow-sm shadow-blue-400/30"></div>
      <div className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full animate-float-slowest animate-pulse-fade shadow-sm shadow-purple-400/30"></div>
      
      {/* Additional particles for more coverage */}
      <div className="absolute top-1/4 right-1/6 w-0.5 h-0.5 bg-gradient-to-r from-cyan-300 to-cyan-200 rounded-full animate-float-slow animate-pulse-fade shadow-sm shadow-cyan-300/30"></div>
      <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-gradient-to-r from-blue-300 to-blue-200 rounded-full animate-float-slower animate-pulse-fade shadow-sm shadow-blue-300/30"></div>
      <div className="absolute bottom-1/4 right-1/3 w-0.5 h-0.5 bg-gradient-to-r from-purple-300 to-purple-200 rounded-full animate-float-slowest animate-pulse-fade shadow-sm shadow-purple-300/30"></div>
      
      <div className="absolute top-3/4 left-1/3 w-0.5 h-0.5 bg-gradient-to-r from-cyan-200 to-cyan-100 rounded-full animate-float-slow animate-pulse-fade shadow-sm shadow-cyan-200/30"></div>
      <div className="absolute bottom-1/6 right-1/6 w-1 h-1 bg-gradient-to-r from-blue-200 to-blue-100 rounded-full animate-float-slower animate-pulse-fade shadow-sm shadow-blue-200/30"></div>
      <div className="absolute top-1/3 left-2/3 w-0.5 h-0.5 bg-gradient-to-r from-purple-200 to-purple-100 rounded-full animate-float-slowest animate-pulse-fade shadow-sm shadow-purple-200/30"></div>
      
      <div className="absolute top-1/8 right-1/2 w-0.5 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full animate-float-slow animate-pulse-fade shadow-sm shadow-cyan-400/30"></div>
      <div className="absolute bottom-1/8 left-1/8 w-1 h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full animate-float-slower animate-pulse-fade shadow-sm shadow-blue-400/30"></div>
      <div className="absolute top-5/6 right-1/8 w-0.5 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full animate-float-slowest animate-pulse-fade shadow-sm shadow-purple-400/30"></div>
      {dense && (
        <>
          <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-cyan-300/60 rounded-full animate-float-slow animate-pulse-fade" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-0.5 h-0.5 bg-blue-300/60 rounded-full animate-float-slower animate-pulse-fade" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-2/3 left-1/5 w-0.5 h-0.5 bg-purple-300/60 rounded-full animate-float-slowest animate-pulse-fade" style={{ animationDelay: '2s' }}></div>
        </>
      )}
    </div>
  );
};

export default ShootingStars; 