
import { CleanerLevel, CleanerProfile, PointTransaction, CleanerStatus } from "../types";

const THRESHOLDS = {
    [CleanerLevel.BRONZE]: 0,
    [CleanerLevel.SILVER]: 300,
    [CleanerLevel.GOLD]: 700
};

export const calculateLevel = (points: number): CleanerLevel => {
    if (points >= THRESHOLDS[CleanerLevel.GOLD]) return CleanerLevel.GOLD;
    if (points >= THRESHOLDS[CleanerLevel.SILVER]) return CleanerLevel.SILVER;
    return CleanerLevel.BRONZE;
};

export const getNextLevelThreshold = (level: CleanerLevel): number | null => {
    if (level === CleanerLevel.BRONZE) return THRESHOLDS[CleanerLevel.SILVER];
    if (level === CleanerLevel.SILVER) return THRESHOLDS[CleanerLevel.GOLD];
    return null;
};

export const addPoints = (cleaner: CleanerProfile, amount: number, reason: string, campaignId?: string): CleanerProfile => {
    const newPoints = Math.max(0, cleaner.points + amount); 
    const newLevel = calculateLevel(newPoints);
    const transaction: PointTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount,
        reason,
        date: new Date().toISOString(),
        campaignId
    };

    return {
        ...cleaner,
        points: newPoints,
        level: newLevel,
        pointHistory: [transaction, ...cleaner.pointHistory]
    };
};

export const sortCleanersByMerit = (cleaners: CleanerProfile[]): CleanerProfile[] => {
    return [...cleaners].sort((a, b) => {
        if (a.status === CleanerStatus.ACTIVE && b.status !== CleanerStatus.ACTIVE) return -1;
        if (a.status !== CleanerStatus.ACTIVE && b.status === CleanerStatus.ACTIVE) return 1;

        const levelScore = { [CleanerLevel.GOLD]: 3, [CleanerLevel.SILVER]: 2, [CleanerLevel.BRONZE]: 1 };
        if (levelScore[a.level] > levelScore[b.level]) return -1;
        if (levelScore[a.level] < levelScore[b.level]) return 1;

        if (a.points > b.points) return -1;
        if (a.points < b.points) return 1;

        return b.rating - a.rating;
    });
};

export const meritService = {
  calculateLevel,
  getNextLevelThreshold,
  addPoints,
  sortCleanersByMerit,
  calculateScore: (pro: CleanerProfile): number => {
    // Scoring Formula: (Rating * 10) + (Points / 5) + (Level Bonus)
    const levelBonus = { [CleanerLevel.GOLD]: 50, [CleanerLevel.SILVER]: 20, [CleanerLevel.BRONZE]: 0 };
    return (pro.rating * 10) + (pro.points / 5) + levelBonus[pro.level];
  }
};
