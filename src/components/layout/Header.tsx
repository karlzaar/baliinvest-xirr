export function Header() {
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-10 lg:px-20 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-16 h-16"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BaliInvest</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Property Investment Tools</p>
          </div>
        </div>
      </div>
    </header>
  );
}
