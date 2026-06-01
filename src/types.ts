export type DateType = 'due' | 'before' | 'start' | 'end';

export interface TaskDate {
	type: DateType;
	value: string; // ISO 8601: "2025-06-10"
}

export interface VaultTask {
	id: string;           // "filepath:lineNumber"
	text: string;         // raw task text (without the "- [ ] " prefix)
	sourcePath: string;   // relative path in vault
	sourceLine: number;   // 0-based line number
	dates: TaskDate[];
	completed: boolean;
}

export const DATE_EMOJI: Record<DateType, string> = {
	due: '📅',
	start: '🛫',
	end: '🏁',
	before: '⏳',
};

export const DATE_LABEL: Record<DateType, string> = {
	due: 'Due',
	start: 'Start',
	end: 'End',
	before: 'Before',
};

export interface PluginSettings {
	weeksBack: number;    // weeks before today to show  (default: 1)
	weeksForward: number; // weeks ahead of today to show (default: 4)
}

export const DEFAULT_SETTINGS: PluginSettings = {
	weeksBack: 1,
	weeksForward: 4,
};
