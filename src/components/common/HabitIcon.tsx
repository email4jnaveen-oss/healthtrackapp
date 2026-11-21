import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Sun,
} from 'lucide-react';
import React from 'react';

export const HABIT_ICON_OPTIONS = [
  {id: 'Sun', label: 'Sun'},
  {id: 'Footprints', label: 'Walk'},
  {id: 'Moon', label: 'Sleep'},
  {id: 'Droplets', label: 'Water'},
  {id: 'Heart', label: 'Heart'},
  {id: 'Dumbbell', label: 'Exercise'},
  {id: 'Apple', label: 'Nutrition'},
  {id: 'Brain', label: 'Mindfulness'},
  {id: 'BookOpen', label: 'Read'},
  {id: 'Leaf', label: 'Outdoors'},
  {id: 'Activity', label: 'Vitals'},
  {id: 'Flame', label: 'Energy'},
] as const;

export const HabitIcon: React.FC<{name: string; className?: string}> = ({
  name,
  className = 'h-4 w-4',
}) => {
  switch (name) {
    case 'Sun':
      return <Sun className={className} />;
    case 'Footprints':
      return <Footprints className={className} />;
    case 'Moon':
      return <Moon className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Apple':
      return <Apple className={className} />;
    case 'Brain':
      return <Brain className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Leaf':
      return <Leaf className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    default:
      return <CheckCircle2 className={className} />;
  }
};
