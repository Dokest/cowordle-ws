
export enum WordlePoints {
	Missing = 0,
	InWord = 1,
	Exact = 2,
}

export function validateWord(userWord: string, solution: string): WordlePoints[] {
	return [...userWord].map((letter, index) => {
		const solutionLetter = solution.at(index);

		if (solutionLetter === letter) {
			return WordlePoints.Exact;
		}

		return solution.includes(letter)
			? WordlePoints.InWord
			: WordlePoints.Missing;
	});
}
