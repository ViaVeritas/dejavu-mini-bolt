import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressPath, WeeklyMilestone, eventBus, ProgressPathCreatedEvent, ProgressPathError } from './eventBus';
import { Category } from './eventBus';

export class ProgressPathManager {
  private static instance: ProgressPathManager;

  private constructor() {}

  static getInstance(): ProgressPathManager {
    if (!ProgressPathManager.instance) {
      ProgressPathManager.instance = new ProgressPathManager();
    }
    return ProgressPathManager.instance;
  }

  async createProgressPathForCategory(category: Category): Promise<ProgressPath | null> {
    try {
      // console.log('Creating progress path for category:', category.id);

      // Calculate timeline from outputs
      const deadlines = category.outputs?.map(output => output.targetDate ? new Date(output.targetDate) : new Date()) || [];
      const maxDeadline = deadlines.length > 0 ? new Date(Math.max(...deadlines.map(d => d.getTime()))) : new Date();
      
      // Calculate weeks from now to deadline
      const now = new Date();
      const weeksDiff = Math.ceil((maxDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const totalWeeks = Math.max(weeksDiff, 4); // Minimum 4 weeks

      const weeklyMilestones: WeeklyMilestone[] = [];

      // Create weekly milestones
      for (let week = 1; week <= totalWeeks; week++) {
        const milestone: WeeklyMilestone = {
          weekNumber: week,
          objectives: this.generateWeeklyObjectives(category, week, totalWeeks),
          actions: this.generateWeeklyActions(category, week, totalWeeks),
          successCriteria: this.generateSuccessCriteria(category, week, totalWeeks),
          completed: false,
          notes: ''
        };
        weeklyMilestones.push(milestone);
      }

      const progressPath: ProgressPath = {
        id: `progress_${category.id}`,
        categoryId: category.id,
        weeklyMilestones,
        currentWeek: 1,
        totalWeeks,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveProgressPath(progressPath);

      // Emit success event
      const event: ProgressPathCreatedEvent = {
        type: 'PROGRESS_PATH_CREATED',
        categoryId: category.id,
        progressPath,
        timestamp: new Date()
      };
      eventBus.emit(event);

      // console.log('Progress path created successfully:', progressPath);
      return progressPath;

    } catch (error) {
      console.error('Error creating progress path:', error);
      
      // Emit error event
      const errorEvent: ProgressPathError = {
        type: 'PROGRESS_PATH_ERROR',
        categoryId: category.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        instructions: `Please manually create a progress plan for ${category.title}. Break down your goals into weekly milestones and track your progress.`,
        timestamp: new Date()
      };
      eventBus.emit(errorEvent);
      
      return null;
    }
  }

  private generateWeeklyObjectives(category: Category, week: number, totalWeeks: number): string[] {
    const objectives: string[] = [];
    
    if (category.type === 'input') {
      // For input categories, focus on habit building
      if (week === 1) {
        objectives.push('Establish daily routine for this category');
        objectives.push('Set up tracking system');
      } else if (week <= 3) {
        objectives.push('Build consistency in daily habits');
        objectives.push('Identify and overcome obstacles');
      } else {
        objectives.push('Maintain established habits');
        objectives.push('Optimize and refine routine');
      }
    } else {
      // For output categories, focus on progress toward goals
      const progressPercentage = (week / totalWeeks) * 100;
      
      if (week === 1) {
        objectives.push('Define specific milestones for this week');
        objectives.push('Set up progress tracking');
      } else if (progressPercentage <= 50) {
        objectives.push(`Make progress toward ${Math.round(progressPercentage)}% of goal`);
        objectives.push('Overcome any blockers');
      } else {
        objectives.push(`Complete ${Math.round(progressPercentage)}% of goal`);
        objectives.push('Prepare for final push');
      }
    }

    return objectives;
  }

  private generateWeeklyActions(category: Category, week: number, totalWeeks: number): string[] {
    const actions: string[] = [];
    
    if (category.type === 'input') {
      // Health inputs
      if (category.inputs?.some(input => input.type === 'health')) {
        actions.push('Schedule daily time for health activities');
        actions.push('Prepare environment for success');
        actions.push('Track daily completion');
      }
      
      // Strength inputs
      if (category.inputs?.some(input => input.type === 'strength')) {
        actions.push('Dedicate focused time for skill development');
        actions.push('Practice and apply new skills');
        actions.push('Seek feedback and adjust approach');
      }
    } else {
      // Output categories
      actions.push('Review weekly objectives');
      actions.push('Break down tasks into daily actions');
      actions.push('Monitor progress and adjust as needed');
    }

    return actions;
  }

  private generateSuccessCriteria(category: Category, week: number, totalWeeks: number): string[] {
    const criteria: string[] = [];
    
    if (category.type === 'input') {
      criteria.push('Complete daily activities at least 5 days this week');
      criteria.push('Maintain consistent schedule');
      criteria.push('Track progress and note improvements');
    } else {
      criteria.push('Achieve weekly objectives');
      criteria.push('Make measurable progress toward goals');
      criteria.push('Stay on track with timeline');
    }

    return criteria;
  }

  async saveProgressPath(progressPath: ProgressPath): Promise<void> {
    try {
      const key = `progress_path_${progressPath.categoryId}`;
      await AsyncStorage.setItem(key, JSON.stringify(progressPath));
    } catch (error) {
      console.error('Error saving progress path:', error);
    }
  }

  async loadProgressPath(categoryId: string): Promise<ProgressPath | null> {
    try {
      const key = `progress_path_${categoryId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error loading progress path:', error);
      return null;
    }
  }

  async updateProgressPath(progressPath: ProgressPath): Promise<void> {
    try {
      progressPath.updatedAt = new Date();
      await this.saveProgressPath(progressPath);
    } catch (error) {
      console.error('Error updating progress path:', error);
    }
  }

  async clearProgressPath(categoryId: string): Promise<void> {
    try {
      const key = `progress_path_${categoryId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing progress path:', error);
    }
  }

  async clearAllProgressPaths(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith('progress_path_'));
      await AsyncStorage.multiRemove(progressKeys);
    } catch (error) {
      console.error('Error clearing all progress paths:', error);
    }
  }
}

export const progressPathManager = ProgressPathManager.getInstance();



