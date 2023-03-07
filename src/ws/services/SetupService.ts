import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Database } from '../../database/Database.ts';
import { Player } from '../../database/models/Player.ts';
import { Room } from '../../database/models/Room.ts';


export class SetupService {
	constructor(private readonly io: Server, private readonly database: Database) { }

	async connectToRoom(socket: any, roomCode: string, playerName: string): Promise<void> {
		const now = Date.now();

		const player = new Player(playerName, now);

		const room = this.database.getRoom(roomCode);

		if (!room) {
			return;
		}

		room.addPlayer(player);

		await socket.join(roomCode);

		socket.emit('setup', {
			players: room.getPlayers(),
			hostPlayer: room.getHost(),
			localPlayer: player,
		});

		this.io.to(roomCode).emit('player_connected', {
			newPlayer: player,
		});

		console.log(`Player '${playerName}' connected to room '${roomCode}'.`);
	}

	createRoom(roomCode: string): Room | null {
		return this.database.createRoom(roomCode);
	}

	removePlayer(roomCode: string, targetPlayerUuid: string, requestingPlayerUuid: string): boolean {
		const room = this.database.getRoom(roomCode);

		if (!room || room.getHost()?.uuid !== requestingPlayerUuid) {
			return false;
		}

		const player = room.getPlayers().find((player) => player.uuid === targetPlayerUuid);

		if (!player) {
			return false;
		}

		room.removePlayer(player);

		return true;
	}
}
