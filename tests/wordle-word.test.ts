import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { validateWord } from "../src/ws/services/WordleService.ts";

type WordleResult = 0 | 1 | 2;

interface WordTest {
	solution: string;
	words: {
		word: string;
		expected: [WordleResult, WordleResult, WordleResult, WordleResult, WordleResult];
	}[];
}


Deno.test({
	name: 'Validate word',
}, async (test) => {
	const validations: WordTest[] = [
		{
			solution: 'TESTS',
			words: [
				{
					word: 'TESTS',
					expected: [2, 2, 2, 2, 2],
				},
				{
					word: 'TESTT',
					expected: [2, 2, 2, 2, 0],
				},
				{
					word: 'SPLIT',
					expected: [1, 0, 0, 0, 1],
				},
				{
					word: 'SPLTT',
					expected: [1, 0, 0, 2, 1],
				},
				{
					word: 'STLAT',
					expected: [1, 1, 0, 0, 1],
				},
				{
					word: 'ATTAT',
					expected: [0, 1, 1, 0, 0],
				},
				{
					word: 'AAAAA',
					expected: [0, 0, 0, 0, 0],
				},
			]
		}
	];

	for await (const validation of validations) {
		for await (const word of validation.words) {
			await test.step({
				name: `${validation.solution} -> ${word.word}`,
				fn: () => {
					const result = validateWord(word.word, validation.solution);

					assertEquals(result, word.expected);
				},
			});
		}
	}
});