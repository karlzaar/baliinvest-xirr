import { useState } from 'react';

interface Props {
  text: string;
  children?: React.ReactNode;
}

export function Tooltip({ text }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 text-[10px] font-bold flex items-center justify-center transition-colors cursor-help"
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-normal w-64 z-50 animate-in fade-in duration-150 normal-case tracking-normal font-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
