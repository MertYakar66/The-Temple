import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Welcome } from '../components/onboarding/Welcome';
import { ProfileSetup, type ProfileData } from '../components/onboarding/ProfileSetup';
import { GoalsSetup } from '../components/onboarding/GoalsSetup';
import { ExperienceSetup } from '../components/onboarding/ExperienceSetup';
import { EquipmentSetup } from '../components/onboarding/EquipmentSetup';
import { useStore } from '../store/useStore';
import type { TrainingGoal, ExperienceLevel, Equipment, UserProfile } from '../types';

type OnboardingStep = 'welcome' | 'profile' | 'goals' | 'experience' | 'equipment';

export function Onboarding() {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const [step, setStep] = useState<OnboardingStep>('welcome');

  // Collect data across steps
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [goal, setGoal] = useState<TrainingGoal | null>(null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);

  const handleProfileComplete = (data: ProfileData) => {
    setProfileData(data);
    setStep('goals');
  };

  const handleGoalsComplete = (selectedGoal: TrainingGoal) => {
    setGoal(selectedGoal);
    setStep('experience');
  };

  const handleExperienceComplete = (level: ExperienceLevel) => {
    setExperience(level);
    setStep('equipment');
  };

  const handleEquipmentComplete = (equipment: Equipment) => {
    if (!profileData || !goal || !experience) return;

    const user: UserProfile = {
      id: uuidv4(),
      name: profileData.name,
      age: profileData.age,
      height: profileData.height,
      weight: profileData.weight,
      trainingGoal: goal,
      experienceLevel: experience,
      equipment: equipment,
      unitSystem: profileData.unitSystem,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(user);
    navigate('/', { replace: true });
  };

  switch (step) {
    case 'welcome':
      return <Welcome onNext={() => setStep('profile')} />;
    case 'profile':
      return (
        <ProfileSetup
          onNext={handleProfileComplete}
          onBack={() => setStep('welcome')}
          initialData={profileData || undefined}
        />
      );
    case 'goals':
      return (
        <GoalsSetup
          onNext={handleGoalsComplete}
          onBack={() => setStep('profile')}
          initialGoal={goal || undefined}
        />
      );
    case 'experience':
      return (
        <ExperienceSetup
          onNext={handleExperienceComplete}
          onBack={() => setStep('goals')}
          initialLevel={experience || undefined}
        />
      );
    case 'equipment':
      return (
        <EquipmentSetup
          onNext={handleEquipmentComplete}
          onBack={() => setStep('experience')}
          initialEquipment={undefined}
        />
      );
    default:
      return null;
  }
}
