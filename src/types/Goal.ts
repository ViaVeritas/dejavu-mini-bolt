export interface Goal {
  id: string;
  title: string;
  goalCount: number;
  type: 'input' | 'output';
}

export interface IndividualGoal {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  completed: boolean;
  categoryId: string;
}