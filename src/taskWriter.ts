import { App, TFile } from 'obsidian';
import { DateType } from './types';
import { setDateInLine, removeDateFromLine } from './taskParser';

const LOG = (...args: unknown[]) => console.log('[TaskPlanner]', ...args);

function getFile(app: App, sourcePath: string): TFile {
	const file = app.vault.getAbstractFileByPath(sourcePath);
	if (!file || !(file instanceof TFile)) {
		throw new Error(`File not found: ${sourcePath}`);
	}
	return file;
}

export async function writeTaskDate(
	app: App,
	sourcePath: string,
	sourceLine: number,
	type: DateType,
	isoDate: string,
): Promise<void> {
	const file = getFile(app, sourcePath);
	LOG(`writeTaskDate — ${sourcePath}:${sourceLine} type=${type} date=${isoDate}`);

	await (app.vault as any).process(file, (content: string) => {
		const lines = content.split('\n');
		if (sourceLine >= lines.length) throw new Error(`Line ${sourceLine} out of bounds`);
		const before = lines[sourceLine];
		lines[sourceLine] = setDateInLine(before, type, isoDate);
		LOG(`  before: ${before}`);
		LOG(`  after:  ${lines[sourceLine]}`);
		return lines.join('\n');
	});
}

export async function completeTask(
	app: App,
	sourcePath: string,
	sourceLine: number,
): Promise<void> {
	const file = getFile(app, sourcePath);
	LOG(`completeTask — ${sourcePath}:${sourceLine}`);

	await (app.vault as any).process(file, (content: string) => {
		const lines = content.split('\n');
		if (sourceLine >= lines.length) throw new Error(`Line ${sourceLine} out of bounds`);
		const before = lines[sourceLine];
		const updated = before.replace(/^(\s*-\s+)\[ \]/, '$1[x]');
		if (updated === before) {
			LOG(`  WARN: line does not match incomplete-task pattern: "${before}"`);
			throw new Error(`Line ${sourceLine} is not an incomplete task`);
		}
		LOG(`  before: ${before}`);
		LOG(`  after:  ${updated}`);
		lines[sourceLine] = updated;
		return lines.join('\n');
	});

	LOG(`completeTask — write done`);
}

export async function removeTaskDate(
	app: App,
	sourcePath: string,
	sourceLine: number,
	type: DateType,
): Promise<void> {
	const file = getFile(app, sourcePath);
	LOG(`removeTaskDate — ${sourcePath}:${sourceLine} type=${type}`);

	await (app.vault as any).process(file, (content: string) => {
		const lines = content.split('\n');
		if (sourceLine >= lines.length) throw new Error(`Line ${sourceLine} out of bounds`);
		lines[sourceLine] = removeDateFromLine(lines[sourceLine], type);
		return lines.join('\n');
	});
}
