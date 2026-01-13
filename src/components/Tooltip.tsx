import { useState } from 'react';

interface TooltipProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ text, size = 'sm', position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5 text-[8px]',
    md: 'w-4 h-4 text-[9px]',
    lg: 'w-5 h-5 text-[10px]'
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800'
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className={`${sizeClasses[size]} rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 font-bold flex items-center justify-center transition-colors cursor-help ml-1`}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.preventDefault();
          setShow(!show);
        }}
      >
        ?
      </button>
      {show && (
        <div className={`absolute ${positionClasses[position]} px-3 py-2 bg-slate-800 text-white text-[11px] leading-relaxed rounded-lg shadow-lg whitespace-normal w-52 z-50`}>
          {text}
          <div className={`absolute ${arrowClasses[position]} border-4 border-transparent`} />
        </div>
      )}
    </div>
  );
}

export default Tooltip;
