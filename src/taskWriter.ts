import { App, TFile } from 'obsidian';
import { DateType } from './types';
import { setDateInLine, removeDateFromLine } from './taskParser';

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

	await (app.vault as any).process(file, (content: string) => {
		const lines = content.split('\n');
		if (sourceLine >= lines.length) throw new Error(`Line ${sourceLine} out of bounds`);
		lines[sourceLine] = setDateInLine(lines[sourceLine], type, isoDate);
		return lines.join('\n');
	});
}

export async function completeTask(
	app: App,
	sourcePath: string,
	sourceLine: number,
): Promise<void> {
	const file = getFile(app, sourcePath);

	await (app.vault as any).process(file, (content: string) => {
		const lines = content.split('\n');
		if (sourceLine >= lines.length) throw new Error(`Line ${sourceLine} out of bounds`);
		const updated = lines[sourceLine].replace(/^(\s*-\s+)\[ \]/, '$1[x]');
		if (updated === lines[sourceLine]) {
			throw new Error(`Line ${sourceLine} is not an incomplete task`);
		}
		lines[sourceLine] = updated;
		return lines.join('\n');
	});
}

export async function removeTaskDate(
	app: App,
	sourcePath: string,
	sourceLine: number,
	type: DateType,
): Promise<void> {
	const file = getFile(app, sourcePath);

	await (app.vault as any).process(file, (content: string) => {
		const lines = content.split('\n');
		if (sourceLine >= lines.length) throw new Error(`Line ${sourceLine} out of bounds`);
		lines[sourceLine] = removeDateFromLine(lines[sourceLine], type);
		return lines.join('\n');
	});
}
