import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, Edit2, Trash2 } from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';
import { DEFAULT_CALENDAR_COLORS } from '../types/calendar';
import type { CalendarType } from '../types/calendar';

export function CalendarManage() {
  const navigate = useNavigate();
  const calendars = useCalendarStore((s) => s.calendars);
  const toggleCalendarVisibility = useCalendarStore((s) => s.toggleCalendarVisibility);
  const addCalendar = useCalendarStore((s) => s.addCalendar);
  const updateCalendar = useCalendarStore((s) => s.updateCalendar);
  const deleteCalendar = useCalendarStore((s) => s.deleteCalendar);
  const updateSettings = useCalendarStore((s) => s.updateSettings);
  const settings = useCalendarStore((s) => s.settings);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_CALENDAR_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = addCalendar({
      name: newName.trim(),
      color: newColor,
      type: 'personal' as CalendarType,
      isVisible: true,
      isReadOnly: false,
      isDefault: false,
      sortOrder: calendars.length,
    });
    // If first calendar, make it default
    if (calendars.length === 0) {
      updateSettings({ defaultCalendarId: id });
    }
    setNewName('');
    setShowNew(false);
  };

  const handleStartEdit = (cal: typeof calendars[0]) => {
    setEditingId(cal.id);
    setEditName(cal.name);
    setEditColor(cal.color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateCalendar(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const cal = calendars.find((c) => c.id === id);
    if (!cal) return;
    if (window.confirm(`Delete "${cal.name}" and all its events?`)) {
      deleteCalendar(id);
      if (settings.defaultCalendarId === id) {
        const remaining = calendars.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          updateSettings({ defaultCalendarId: remaining[0].id });
        }
      }
    }
  };

  const handleSetDefault = (id: string) => {
    updateSettings({ defaultCalendarId: id });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 dark:text-gray-300">
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white">Calendars</h1>
        <button
          onClick={() => setShowNew(true)}
          className="p-2 text-primary-600 dark:text-primary-400"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {calendars.map((cal) => {
          const isDefault = cal.id === settings.defaultCalendarId;
          const isEditing = editingId === cal.id;

          if (isEditing) {
            return (
              <div key={cal.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CALENDAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${
                        editColor === c ? 'border-gray-900 dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-2 text-sm text-gray-500 rounded-lg bg-gray-100 dark:bg-gray-700">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="flex-1 py-2 text-sm text-white bg-primary-600 rounded-lg font-medium">
                    Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={cal.id} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
              {/* Visibility toggle */}
              <button
                onClick={() => toggleCalendarVisibility(cal.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors`}
                style={{
                  borderColor: cal.color,
                  backgroundColor: cal.isVisible ? cal.color : 'transparent',
                }}
              >
                {cal.isVisible && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {cal.name}
                  {isDefault && (
                    <span className="ml-2 text-[10px] font-normal text-primary-500 uppercase">Default</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{cal.type}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {!isDefault && (
                  <button
                    onClick={() => handleSetDefault(cal.id)}
                    className="text-[10px] text-gray-400 hover:text-primary-500 px-1.5 py-0.5"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleStartEdit(cal)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {calendars.length > 1 && (
                  <button
                    onClick={() => handleDelete(cal.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New calendar modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-sm sm:rounded-xl rounded-t-xl p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white">New Calendar</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Calendar name"
              className="w-full text-sm bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white outline-none"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CALENDAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newColor === c ? 'border-gray-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 text-sm text-gray-500 rounded-lg bg-gray-100 dark:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-2.5 text-sm text-white bg-primary-600 rounded-lg font-medium disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
