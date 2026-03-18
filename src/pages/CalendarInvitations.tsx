import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Check, X, HelpCircle } from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';
import { formatEventTime } from '../utils/calendar';

export function CalendarInvitations() {
  const navigate = useNavigate();
  const invitations = useCalendarStore((s) => s.invitations);
  const respondToInvitation = useCalendarStore((s) => s.respondToInvitation);
  const markInvitationRead = useCalendarStore((s) => s.markInvitationRead);
  const settings = useCalendarStore((s) => s.settings);

  const pending = invitations.filter((inv) => inv.status === 'pending');
  const responded = invitations.filter((inv) => inv.status !== 'pending');

  const handleRespond = (id: string, status: 'accepted' | 'declined' | 'maybe') => {
    respondToInvitation(id, status);
    markInvitationRead(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 dark:text-gray-300">
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white ml-3">Invitations</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No invitations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Pending</h2>
                <div className="space-y-2">
                  {pending.map((inv) => (
                    <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{inv.eventTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        From {inv.organizerName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(parseISO(inv.startDate), 'MMM d, yyyy')} &middot;{' '}
                        {inv.isAllDay ? 'All day' : formatEventTime(inv.startDate, settings.use24HourTime)}
                      </p>
                      {inv.location && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{inv.location}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRespond(inv.id, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleRespond(inv.id, 'maybe')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Maybe
                        </button>
                        <button
                          onClick={() => handleRespond(inv.id, 'declined')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {responded.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Responded</h2>
                <div className="space-y-2">
                  {responded.map((inv) => (
                    <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 opacity-70">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{inv.eventTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                        {inv.status} &middot; From {inv.organizerName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
