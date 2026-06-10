import { App, TFile } from 'obsidian';
import { VaultTask } from './types';
import { isTaskLine, isCompletedTask, extractTaskText, parseDatesFromLine } from './taskParser';

function makeTaskId(path: string, line: number): string {
	return `${path}:${line}`;
}

/** Scan backwards from lineIndex and return the text of the nearest heading, or null. */
function nearestHeading(lines: string[], lineIndex: number): string | null {
	for (let i = lineIndex - 1; i >= 0; i--) {
		const match = /^#{1,6}\s+(.+)/.exec(lines[i]);
		if (match) return match[1].trim();
	}
	return null;
}

export async function scanFile(app: App, file: TFile): Promise<VaultTask[]> {
	const content = await app.vault.cachedRead(file);
	const lines = content.split('\n');
	const tasks: VaultTask[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!isTaskLine(line)) continue;
		if (isCompletedTask(line)) continue;

		tasks.push({
			id: makeTaskId(file.path, i),
			text: extractTaskText(line),
			sourcePath: file.path,
			sourceLine: i,
			sourceHeading: nearestHeading(lines, i),
			dates: parseDatesFromLine(line),
			completed: false,
		});
	}
	return tasks;
}

export async function scanVault(app: App): Promise<VaultTask[]> {
	const files = app.vault.getMarkdownFiles();
	const results = await Promise.all(files.map(f => scanFile(app, f)));
	return results.flat();
}
