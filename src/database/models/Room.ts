import { EN_WORDS } from '../../../static/en_words.ts';
import { ES_WORDS } from '../../../static/es_words.ts';
import { Player } from './Player.ts';


export type RoomStates = 'LOBBY' | 'IN-GAME';


export class Room {
	private readonly MAX_PLAYERS = 5;

	private players: Player[] = [];

	private solution = '';

	private host: Player | null = null;

	private state: RoomStates = 'LOBBY';

	static MAX_WORDS = 6;

	private wordListId = 'en_words';


	addPlayer(player: Player): void {
		if (this.players.length === 0) {
			this.host = player;
		}

		this.players = [...this.players, player];

		player.isPlayingThisMatch = false;
	}


	rollWord(): void {
		let list: string[];

		switch (this.wordListId) {
			case "es_words":
				list = ES_WORDS;
				break;
			default:
				list = EN_WORDS;
				break;
		}

		this.solution = list.at(Math.random() * (list.length - 1))!;
	}


	removePlayer(playerUuid: string): void {
		// for (const existingPlayer of this.players) {
		// 	if (existingPlayer.name === player.name) {
		// 		// TODO: Remove player
		// 	}
		// }
		this.players = this.players.filter((existingPlayer) => existingPlayer.uuid !== playerUuid);
	}


	setHost(player: Player): void {
		this.host = player;
	}


	resetPlayerScores(): void {
		this.players.forEach((player) => {
			player.reset();
			player.isPlayingThisMatch = true;
		});

	}


	hasEmptySpaces(): boolean {
		return true;
		// return this.players.length < this.MAX_PLAYERS;
	}


	getPlayers(): Player[] {
		return this.players;
	}


	findPlayer(targetUuid: string): Player | undefined {
		return this.getPlayers().find((player) => player.uuid === targetUuid);
	}


	getHost(): Player | null {
		return this.host;
	}


	getSolution(): string {
		return this.solution;
	}


	setState(state: RoomStates): void {
		this.state = state;
	}


	getState(): RoomStates {
		return this.state;
	}


	setWordListId(wordListId: string): void {
		this.wordListId = wordListId;
	}


	getWordListId(): string {
		return this.wordListId;
	}
}
