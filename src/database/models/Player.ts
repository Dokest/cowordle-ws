import { WordlePoints } from "../../ws/services/WordleService.ts";


export class Player {
	readonly uuid: string = '';

	wordTries: { word: string, result: WordlePoints[] }[] = [];

	knownLetters: Array<WordlePoints | null>;

	isPlayingThisMatch = false;

	disconnectedTimeout: number | undefined = undefined;


	constructor(public name: string, readonly connectionTimestamp: number, uuid?: string) {
		this.uuid = uuid || crypto.randomUUID();

		this.knownLetters = [];
		this.knownLetters.length = 5;

		this.reset();
	}


	addWord(word: string, result: WordlePoints[]): void {
		this.wordTries = [
			...this.wordTries,
			{ word, result },
		];

		result.forEach((letterResult, index) => {
			if (letterResult !== this.knownLetters[index]) {
				const bestResult = this.knownLetters[index] === null || letterResult > this.knownLetters[index]!
					? letterResult
					: this.knownLetters[index];

				this.knownLetters[index] = bestResult;
			}
		});
	}


	getKnownLetters(): Array<WordlePoints | null> {
		return this.knownLetters;
	}


	reset(): void {
		this.wordTries = [];

		this.knownLetters = this.knownLetters.fill(null, 0, 5);
	}
}
