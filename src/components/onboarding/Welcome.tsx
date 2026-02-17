import { Dumbbell, Target, TrendingUp, Trophy } from 'lucide-react';

interface WelcomeProps {
  onNext: () => void;
}

export function Welcome({ onNext }: WelcomeProps) {
  const features = [
    {
      icon: Dumbbell,
      title: 'Track Workouts',
      description: 'Log exercises, sets, reps, and weights with ease',
    },
    {
      icon: Target,
      title: 'Custom Routines',
      description: 'Create personalized workout plans tailored to your goals',
    },
    {
      icon: TrendingUp,
      title: 'See Progress',
      description: 'Visualize your gains with detailed analytics',
    },
    {
      icon: Trophy,
      title: 'Beat Your PRs',
      description: 'Track personal records and celebrate achievements',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-600 to-primary-800 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6">
          <Dumbbell className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to TheTemple</h1>
        <p className="text-primary-100 text-center mb-12">
          Your personal workout companion for reaching your fitness goals
        </p>

        <div className="w-full max-w-sm space-y-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 bg-white/10 rounded-xl p-4"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-primary-100">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <button
          onClick={onNext}
          className="w-full bg-white text-primary-600 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
