import { Player } from './Player.ts';


export class Room {
	private readonly MAX_PLAYERS = 5;

	private players: Player[] = [];

	private solution: string = 'beans'; //EN_WORDS.at(Math.random() * (EN_WORDS.length - 1))!;

	private host: Player | null = null;

	addPlayer(player: Player): void {
		if (this.players.length === 0) {
			this.host = player;
		}

		this.players = [...this.players, player];
	}

	removePlayer(player: Player): void {
		// for (const existingPlayer of this.players) {
		// 	if (existingPlayer.name === player.name) {
		// 		// TODO: Remove player
		// 	}
		// }
		this.players = this.players.filter((existingPlayer) => existingPlayer.name !== player.name);
	}

	hasEmptySpaces(): boolean {
		return this.players.length < this.MAX_PLAYERS;
	}

	getPlayers(): Player[] {
		return this.players;
	}

	getHost(): Player | null {
		return this.host;
	}

	getSolution(): string {
		return this.solution;
	}
}
