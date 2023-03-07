import { Player } from './Player.js';

export class Room {
	private readonly MAX_PLAYERS = 5;

	private players: Player[] = [];

	private solution: string = '';

	private host: Player | null = null;

	constructor(readonly roomCode: string) {
		this.solution = 'tests';
	}

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
