import { Socket, SocketServer } from "../../dependencies/socketio.deps.ts";
import { Database } from "../database/Database.ts";
import { extractSocketData } from "./SocketData.ts";


export function disconnectPlayer(database: Database, reason: string, socket: Socket, io: SocketServer): void {
	const socketData = extractSocketData(socket.data);

	if (!socketData) {
		return;
	}

	console.log(`Player [${socketData.playerUuid}] disconnected. Reason: ${JSON.stringify(reason)}`);

	// Cleanup socket data, as is no longer in use
	// socket.data = {};

	const room = database.getRoom(socketData.roomCode);

	if (!room) {
		return;
	}

	room.queuePlayerRemoval(socketData.playerUuid, 10000, () => {
		console.log(`Completely removing player [${socketData.playerUuid}] from room [${socketData.roomCode}]`);

		const everyPlayerHasDisconnected = room.getPlayers().every((player) => player.disconnectedTimeout !== undefined);

		if (everyPlayerHasDisconnected) {
			database.destroyRoom(socketData.roomCode);

			console.log(`Destroying room [${socketData.roomCode}] as is empty`);

			return;
		}

		// Migrate host
		const hostUuid = room.getHost()?.uuid;

		if (hostUuid === socketData.playerUuid) {
			console.log(`Migrating host for room ${socketData.roomCode}.`);

			const newHost = room.getPlayers().find((roomPlayer) => {
				return roomPlayer.disconnectedTimeout === undefined;
			})!;

			room.setHost(newHost);

			io.to(socketData.roomCode).emit('change_host', {
				hostUuid: newHost.uuid,
			});

			console.log(`Migrated host for room ${socketData.roomCode} from [${hostUuid}] to [${newHost.uuid}].`);
		}

		io.to(socketData.roomCode).emit('player_disconnected', {
			playerUuid: socketData.playerUuid,
			reason: 'disconnected',
		});
	});
}
