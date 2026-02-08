interface MacroBarProps {
  current: number;
  target: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  showOverflow?: boolean;
  animated?: boolean;
}

export function MacroBar({
  current,
  target,
  color,
  size = 'md',
  showOverflow = true,
  animated = true,
}: MacroBarProps) {
  const percentage = Math.min((current / target) * 100, showOverflow ? 100 : Infinity);
  const isOver = current > target;

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 overflow-hidden`}>
        <div
          className={`h-full rounded-full ${color} ${animated ? 'transition-all duration-500 ease-out' : ''} ${
            isOver && showOverflow ? 'opacity-80' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface MacroCircleProps {
  current: number;
  target: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
}

export function MacroCircle({
  current,
  target,
  color,
  size = 80,
  strokeWidth = 6,
  label,
  unit = '',
}: MacroCircleProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{Math.round(current)}</span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}
