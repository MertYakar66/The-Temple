import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Dumbbell,
  Clock,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useStore } from '../store/useStore';
import type { WorkoutSession } from '../types';
import {
  getCompletedSetCount,
  getSessionDurationMinutes,
  getTotalVolume,
} from '../utils/workoutMetrics';

export function History() {
  const workoutSessions = useStore((state) => state.workoutSessions);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getWorkoutsForDate = (date: Date): WorkoutSession[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workoutSessions.filter((ws) => ws.date === dateStr);
  };

  const selectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">History</h1>

      {/* Calendar */}
      <div className="card">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayWorkouts = getWorkoutsForDate(day);
            const hasWorkout = dayWorkouts.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                  transition-colors relative
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                  ${isSelected ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}
                  ${isToday && !isSelected ? 'ring-2 ring-primary-600' : ''}
                `}
              >
                <span>{format(day, 'd')}</span>
                {hasWorkout && !isSelected && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 bg-primary-600 rounded-full" />
                )}
                {hasWorkout && isSelected && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date workouts */}
      {selectedDate && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>

          {selectedDateWorkouts.length === 0 ? (
            <div className="card text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No workouts on this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateWorkouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent workouts */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Recent Workouts</h2>
        {workoutSessions.length === 0 ? (
          <div className="card text-center py-8">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No workout history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workoutSessions
              .slice()
              .reverse()
              .slice(0, 10)
              .map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: WorkoutSession }) {
  const [expanded, setExpanded] = useState(false);

  const totalSets = getCompletedSetCount(workout.exercises);
  const totalVolume = getTotalVolume(workout.exercises);
  const duration = getSessionDurationMinutes(workout);

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900">{workout.name}</h3>
            <p className="text-sm text-gray-500">{workout.date}</p>
          </div>
          {duration && (
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              {duration} min
            </div>
          )}
        </div>

        <div className="flex gap-4 text-sm text-gray-600">
          <span>{workout.exercises.length} exercises</span>
          <span>{totalSets} sets</span>
          <span>{totalVolume} kg volume</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {workout.exercises.map((ex) => (
            <div key={ex.id} className="text-sm">
              <p className="font-medium text-gray-900">{ex.exercise.name}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {ex.sets.map((set) => (
                  <span
                    key={set.id}
                    className={`px-2 py-0.5 rounded text-xs ${
                      set.completed
                        ? 'bg-success-500/10 text-success-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {set.weight}kg × {set.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
