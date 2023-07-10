import { SocketServer } from "../../../dependencies/socketio.deps.ts";
import { setSocketData } from "../../actions/SocketData.ts";
import { Database } from '../../database/Database.ts';
import { Player } from '../../database/models/Player.ts';
import { Room } from '../../database/models/Room.ts';


export class SetupService {
	constructor(private readonly io: SocketServer, private readonly database: Database) { }

	async connectToRoom(socket: any, roomCode: string, playerName: string): Promise<void> {
		const now = Date.now();

		const player = new Player(playerName, now);

		const room = this.database.getRoom(roomCode);

		if (!room) {
			return;
		}

		room.addPlayer(player);

		await socket.join(roomCode);

		setSocketData(socket, {
			roomCode,
			playerUuid: player.uuid,
		});

		socket.emit('setup', {
			players: room.getPlayers(),
			hostPlayer: room.getHost(),
			localPlayer: player,
			roomState: room.getState(),
		});

		this.io.to(roomCode).emit('player_connected', {
			newPlayer: player,
		});

		console.log(`Player [${playerName}, ${player.uuid}] connected to room '${roomCode}'.`);
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

		room.removePlayer(player.uuid);

		return true;
	}
}
