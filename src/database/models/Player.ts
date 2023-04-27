import { WordlePoints } from "../../ws/services/WordleService.ts";

export class Player {
	readonly uuid: string = '';

	wordTries: { word: string, result: WordlePoints[] }[] = [];

	constructor(public name: string, readonly connectionTimestamp: number, uuid?: string) {
		this.uuid = uuid || crypto.randomUUID();
	}

	addWord(word: string, result: WordlePoints[]): void {
		this.wordTries = [
			...this.wordTries,
			{ word, result },
		];
	}
}
