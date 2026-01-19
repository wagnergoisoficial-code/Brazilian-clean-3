
import { CleanerLevel, CleanerProfile, PointTransaction } from "../types";

// Level Thresholds - GOVERNANCE RULES
// Bronze: 0 - 299
// Silver: 300 - 699
// Gold: 700+
const THRESHOLDS = {
    [CleanerLevel.BRONZE]: 0,
    [CleanerLevel.SILVER]: 300,
    [CleanerLevel.GOLD]: 700
};

export const calculateLevel = (points: number): CleanerLevel => {
    // Rule 1: Automatic Transition based on totals
    // Rule 2: Supports Upward and Downward movement dynamically
    if (points >= THRESHOLDS[CleanerLevel.GOLD]) return CleanerLevel.GOLD;
    if (points >= THRESHOLDS[CleanerLevel.SILVER]) return CleanerLevel.SILVER;
    return CleanerLevel.BRONZE;
};

export const getNextLevelThreshold = (level: CleanerLevel): number | null => {
    if (level === CleanerLevel.BRONZE) return THRESHOLDS[CleanerLevel.SILVER];
    if (level === CleanerLevel.SILVER) return THRESHOLDS[CleanerLevel.GOLD];
    return null; // Gold is max
};

// Returns a new CleanerProfile with updated points and level
export const addPoints = (cleaner: CleanerProfile, amount: number, reason: string, campaignId?: string): CleanerProfile => {
    // Rule 3: Points reflect behavior. Can go up or down.
    // Prevent negative total points (Rule: 0 is floor)
    const newPoints = Math.max(0, cleaner.points + amount); 
    
    // Rule 1: Automatic Level Recalculation
    // This handles both upgrades (points increase) and downgrades (points decrease)
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

// Sorts cleaners by Merit (Verified > Level > Points > Rating)
export const sortCleanersByMerit = (cleaners: CleanerProfile[]): CleanerProfile[] => {
    return [...cleaners].sort((a, b) => {
        // 1. Verified Status First (Absolute Requirement)
        if (a.status === 'VERIFIED' && b.status !== 'VERIFIED') return -1;
        if (a.status !== 'VERIFIED' && b.status === 'VERIFIED') return 1;

        // 2. Level Priority (Gold > Silver > Bronze)
        const levelScore = { [CleanerLevel.GOLD]: 3, [CleanerLevel.SILVER]: 2, [CleanerLevel.BRONZE]: 1 };
        if (levelScore[a.level] > levelScore[b.level]) return -1;
        if (levelScore[a.level] < levelScore[b.level]) return 1;

        // 3. Points (Higher is better)
        if (a.points > b.points) return -1;
        if (a.points < b.points) return 1;

        // 4. Rating as Tiebreaker
        return b.rating - a.rating;
    });
};
