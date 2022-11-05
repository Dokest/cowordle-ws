import { Server, Socket } from 'socket.io';
import { Database } from '../../database/Database.js';
import { Player } from '../../database/models/Player.js';
import { Room } from '../../database/models/Room.js';

export class SetupService {
	constructor(private readonly io: Server, private readonly database: Database) { }

	async connectToRoom(socket: Socket, roomCode: string, playerName: string): Promise<void> {
		const player = new Player(playerName);

		const room = this.database.getRoom(roomCode);

		if (!room) {
			return;
		}

		room.addPlayer(player);

		await socket.join(roomCode);

		console.log(`Player '${playerName}' connected to room '${roomCode}'.`);

		socket.emit('initial_local_info', {
			uuid: player.uuid,
		});

		this.io.to(roomCode).emit('initial_room_info', {
			players: room.getPlayers(),
			host: room.getHost(),
		});
	}

	createRoom(roomCode: string): Room | null {
		return this.database.createRoom(roomCode);
	}
}
