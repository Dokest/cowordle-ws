
export enum WordlePoints {
	Missing = 0,
	InWord = 1,
	Exact = 2,
}

export function validateWord(userWord: string, solution: string): WordlePoints[] {
	const solutionLetters: (string | null)[] = [...solution];

	const firstPass = [...userWord].map((letter, index) => {
		const solutionLetter = solution.at(index);

		if (solutionLetter === letter) {
			solutionLetters[index] = null;

			return WordlePoints.Exact;
		}

		return WordlePoints.Missing;
	});

	return firstPass.map((result, index) => {
		if (result === WordlePoints.Exact) {
			return result;
		}

		const letter = userWord[index];

		const found = solutionLetters.findIndex((solLetter) => {
			return solLetter === letter;
		});

		if (found !== -1) {
			solutionLetters[found] = null;

			return WordlePoints.InWord;
		}

		return WordlePoints.Missing;
	});

	// return [...userWord].map((letter, index) => {
	// 	const solutionLetter = solution.at(index);

	// 	if (solutionLetter === letter) {
	// 		return WordlePoints.Exact;
	// 	}

	// 	const anotherIndex = [...solution].findIndex((solLetter) => solLetter === letter);

	// 	if (anotherIndex === -1) {
	// 		return WordlePoints.Missing;
	// 	}

	// 	solution[anotherIndex] = null;

	// 	return WordlePoints.InWord;
	// });
}
