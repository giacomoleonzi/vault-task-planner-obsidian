import { DateType, TaskDate, DATE_EMOJI } from './types';

// Emoji patterns for Tasks plugin
const EMOJI_PATTERNS: Record<DateType, RegExp> = {
	due:    /📅\s*(\d{4}-\d{2}-\d{2})/,
	start:  /🛫\s*(\d{4}-\d{2}-\d{2})/,
	end:    /🏁\s*(\d{4}-\d{2}-\d{2})/,
	before: /⏳\s*(\d{4}-\d{2}-\d{2})/,
};

// Dataview inline field patterns: [due:: 2025-06-10] or (due:: 2025-06-10)
const DATAVIEW_PATTERNS: Record<DateType, RegExp> = {
	due:    /[[(]due::\s*(\d{4}-\d{2}-\d{2})[\])]/,
	start:  /[[(]start::\s*(\d{4}-\d{2}-\d{2})[\])]/,
	end:    /[[(]end::\s*(\d{4}-\d{2}-\d{2})[\])]/,
	before: /[[(]scheduled::\s*(\d{4}-\d{2}-\d{2})[\])]/,
};

export function parseDatesFromLine(line: string): TaskDate[] {
	const dates: TaskDate[] = [];
	for (const type of ['due', 'start', 'end', 'before'] as DateType[]) {
		const emojiMatch = EMOJI_PATTERNS[type].exec(line);
		if (emojiMatch) {
			dates.push({ type, value: emojiMatch[1] });
			continue;
		}
		const dvMatch = DATAVIEW_PATTERNS[type].exec(line);
		if (dvMatch) {
			dates.push({ type, value: dvMatch[1] });
		}
	}
	return dates;
}

export function isTaskLine(line: string): boolean {
	return /^\s*-\s+\[( |x|X)\]\s/.test(line);
}

export function isCompletedTask(line: string): boolean {
	return /^\s*-\s+\[[xX]\]\s/.test(line);
}

export function extractTaskText(line: string): string {
	// Remove the "- [ ] " prefix
	return line.replace(/^\s*-\s+\[[ xX]\]\s+/, '').trim();
}

/**
 * Update or insert a date tag in a task line.
 * Replaces the existing emoji date if present, otherwise appends it.
 */
export function setDateInLine(line: string, type: DateType, isoDate: string): string {
	const emoji: string = DATE_EMOJI[type] ?? '';
	const emojiPattern: RegExp = new RegExp(`${emoji}\\s*\\d{4}-\\d{2}-\\d{2}`);
	const replacement: string = `${emoji} ${isoDate}`;

	if (emojiPattern.test(line)) {
		const result: string = line.replace(emojiPattern, replacement);
		return result;
	}

	// Also replace dataview format if present
	const dvPattern: RegExp = DATAVIEW_PATTERNS[type] ?? /(?!)/;
	if (dvPattern.test(line)) {
		const result: string = line.replace(dvPattern, replacement);
		return result;
	}

	// Append before any trailing whitespace
	const trimmed: string = line.trimEnd();
	return `${trimmed} ${replacement}`;
}

/**
 * Remove a specific date type from a task line.
 */
export function removeDateFromLine(line: string, type: DateType): string {
	const emoji: string = DATE_EMOJI[type] ?? '';
	const emojiPattern: RegExp = new RegExp(`\\s*${emoji}\\s*\\d{4}-\\d{2}-\\d{2}`, 'g');
	const withoutEmoji: string = line.replace(emojiPattern, '');
	const dvPattern: RegExp = /\s*[[(](?:due|start|end|scheduled)::\s*\d{4}-\d{2}-\d{2}[\])]/g;
	const withoutDv: string = withoutEmoji.replace(dvPattern, '');
	return withoutDv.trimEnd();
}
