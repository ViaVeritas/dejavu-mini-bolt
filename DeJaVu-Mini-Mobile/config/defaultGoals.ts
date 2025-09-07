export interface DefaultGoal {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface DefaultGoalSet {
  [categoryName: string]: DefaultGoal[];
}

export const DEFAULT_GOALS: DefaultGoalSet = {
  'CSE201 Project 4': [
    { id: '1', title: 'Complete database design', description: 'Design and implement the database schema', completed: false, order: 1 },
    { id: '2', title: 'Implement user authentication', description: 'Add login and registration functionality', completed: false, order: 2 },
    { id: '3', title: 'Build core features', description: 'Implement main application features', completed: false, order: 3 },
    { id: '4', title: 'Write documentation', description: 'Create user and developer documentation', completed: false, order: 4 },
    { id: '5', title: 'Testing and deployment', description: 'Test thoroughly and deploy to production', completed: false, order: 5 }
  ],
  '$5K in MRR': [
    { id: '1', title: 'Launch MVP', description: 'Get minimum viable product to market', completed: false, order: 1 },
    { id: '2', title: 'Acquire first 10 customers', description: 'Find and onboard initial paying customers', completed: false, order: 2 },
    { id: '3', title: 'Optimize conversion funnel', description: 'Improve signup to payment conversion', completed: false, order: 3 },
    { id: '4', title: 'Scale marketing efforts', description: 'Increase marketing spend and channels', completed: false, order: 4 },
    { id: '5', title: 'Reach $5K MRR milestone', description: 'Achieve monthly recurring revenue target', completed: false, order: 5 }
  ],
  'Rest and Sleep': [
    { id: '1', title: 'Set consistent bedtime', description: 'Go to bed at the same time every night', completed: false, order: 1 },
    { id: '2', title: 'Create bedtime routine', description: 'Develop relaxing pre-sleep activities', completed: false, order: 2 },
    { id: '3', title: 'Optimize sleep environment', description: 'Dark, cool, and quiet bedroom setup', completed: false, order: 3 },
    { id: '4', title: 'Limit screen time before bed', description: 'No devices 1 hour before sleep', completed: false, order: 4 }
  ],
  'Exercise': [
    { id: '1', title: 'Morning workout routine', description: '30 minutes of exercise each morning', completed: false, order: 1 },
    { id: '2', title: 'Join a gym or fitness class', description: 'Find a consistent workout environment', completed: false, order: 2 },
    { id: '3', title: 'Track daily steps', description: 'Aim for 10,000 steps per day', completed: false, order: 3 },
    { id: '4', title: 'Strength training twice weekly', description: 'Build muscle with resistance exercises', completed: false, order: 4 },
    { id: '5', title: 'Weekly outdoor activity', description: 'Hiking, cycling, or sports once per week', completed: false, order: 5 }
  ]
};

export const DEFAULT_INITIAL_GOALS = [
  { id: '1', title: 'CSE201 Project 4', goalCount: 0, completedCount: 0, type: 'output' as const },
  { id: '2', title: '$5K in MRR', goalCount: 0, completedCount: 0, type: 'output' as const },
  { id: '3', title: 'Rest and Sleep', goalCount: 0, completedCount: 0, type: 'input' as const },
  { id: '4', title: 'Exercise', goalCount: 0, completedCount: 0, type: 'input' as const },
];

export const DEFAULT_INITIAL_MESSAGE = {
  id: '1',
  text: "Hey, I've been waiting for you. This journey is going to be as easy or difficult as you make it, okay? That version of yourself you daydream about? I'm here to make that real - BUT.... I'm going to need your word that you won't quit right when I can see you're near but you can't. Deal?",
  isUser: false,
  timestamp: new Date(),
};