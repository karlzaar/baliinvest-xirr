import { useState, useRef, useEffect } from 'react';
import type { ArchivedDraft } from '../../hooks/useArchivedDrafts';

interface DraftSelectorProps<T> {
  drafts: ArchivedDraft<T>[];
  onSelect: (draft: ArchivedDraft<T>) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  currentName?: string;
}

export function DraftSelector<T>({
  drafts,
  onSelect,
  onSave,
  onDelete,
  currentName,
}: DraftSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setDeleteConfirm(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (draftName.trim()) {
      onSave(draftName.trim());
      setDraftName('');
      setShowSaveModal(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
      >
        <span className="material-symbols-outlined text-lg text-primary">folder_open</span>
        <span className="text-sm font-medium text-slate-700">
          {currentName || 'Saved Drafts'}
        </span>
        <span className="material-symbols-outlined text-lg text-slate-400">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
        {drafts.length > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {drafts.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Saved Calculations</span>
            <button
              onClick={() => {
                setShowSaveModal(true);
                setIsOpen(false);
              }}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Save Current
            </button>
          </div>

          {/* Drafts List */}
          <div className="max-h-64 overflow-y-auto">
            {drafts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
                <p className="text-sm text-slate-500">No saved calculations yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Save Current" to save your first draft</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {drafts.map((draft) => (
                  <li
                    key={draft.id}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                    onClick={() => {
                      onSelect(draft);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {draft.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(draft.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(draft.id, e)}
                        className={`p-1 rounded transition-colors ${
                          deleteConfirm === draft.id
                            ? 'bg-red-100 text-red-600'
                            : 'opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500'
                        }`}
                        title={deleteConfirm === draft.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <span className="material-symbols-outlined text-base">
                          {deleteConfirm === draft.id ? 'delete_forever' : 'delete'}
                        </span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Save Calculation</h3>
              <p className="text-sm text-slate-500 mt-1">
                Give your calculation a name to easily find it later
              </p>
            </div>
            <div className="px-6 py-4">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g., Villa Canggu 3BR, Investment Option A..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setShowSaveModal(false);
                }}
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!draftName.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
