import { Socket, SocketServer } from "../../dependencies/socketio.deps.ts";
import { Database } from "../database/Database.ts";


export function reconnectPlayer(database: Database, socket: Socket, io: SocketServer, data: { playerUuid: string | undefined; roomCode: string | undefined }): boolean {
	console.log(data);

	if (!data || !data?.playerUuid || !data?.roomCode) {
		console.error('Reconnect: Missing socket data');
		socket.disconnect(true);

		return false;
	}

	const room = database.getRoom(data.roomCode);

	if (!room) {
		console.error('Reconnect: Invalid room');
		socket.disconnect(true);

		return false;
	}

	const reconnected = room.reconnectPlayer(data.playerUuid);

	io.to(data.roomCode).emit('player_connected', {
		newPlayer: room.findPlayer(data.playerUuid),
	});

	return reconnected;
}