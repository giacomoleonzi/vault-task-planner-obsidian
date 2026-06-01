import { App, TFile } from 'obsidian';
import { VaultTask } from './types';
import { isTaskLine, isCompletedTask, extractTaskText, parseDatesFromLine } from './taskParser';

function makeTaskId(path: string, line: number): string {
	return `${path}:${line}`;
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
