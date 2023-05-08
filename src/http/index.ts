import { load } from "https://deno.land/std/dotenv/mod.ts";
import { ConnInfo, serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { SocketServer } from "../../dependencies/socketio.deps.ts";
import { checkLostMatch } from "../actions/CheckLostMatch.ts";
import { createRoom } from "../actions/CreateRoom.ts";
import { extractSocketData } from "../actions/SocketData.ts";
import { Database } from "../database/Database.ts";
import { Room } from "../database/models/Room.ts";
import { SetupService } from "../ws/services/SetupService.ts";
import { WordlePoints, validateWord } from "../ws/services/WordleService.ts";


const configData = await load();
const webapp = configData["WEBAPP_ORIGIN"];

const START_MATCH_DELAY = 4000;

const io = new SocketServer({
	cors: {
		origin: webapp,
		methods: ["GET", "POST", "OPTIONS"],
		credentials: true,
	},
});


export function generateString(length: number): string {
	return (+new Date * Math.random()).toString(36).substring(0, length).toUpperCase();
}


io.on('connect_error', (err) => {
	console.log(`connect_error due to ${err.message}`);
});

io.on('connection', (socket) => {
	console.log(`CONNECTION:`, socket.id);

	socket.on('disconnect', () => {
		const socketData = extractSocketData(socket.data);

		if (!socketData) {
			return;
		}

		socket.data = {};

		io.to(socketData.roomCode).emit('player_disconnected', {
			playerUuid: socketData.playerUuid,
			reason: 'disconnected',
		});

		console.log('DISCONNECT');
	})

	socket.on('message', (data) => {
		console.log('Message received:', data);

		socket.emit('message', `Server replies: ${data}`);
	});

	socket.on('ping', (data) => {
		console.log('Received ping from:', socket.id);

		socket.emit('ping');
	});

	socket.on('setup', async (setupData: { roomCode: string; playerName: string; }) => {
		await setupService.connectToRoom(socket, setupData.roomCode, setupData.playerName);
	});

	socket.on('update_player_name', (playerData: { uuid: string; roomCode: string; newPlayerName: string }) => {
		const player = database.getRoom(playerData.roomCode)?.getPlayers().find((player) => player.uuid === playerData.uuid);

		if (player) {
			player.name = playerData.newPlayerName;
		}

		io.to(playerData.roomCode).emit('update_player_name', {
			playerUuid: playerData.uuid,
			newPlayerName: playerData.newPlayerName,
		});
	});

	socket.on('remove_player', (playerData: { roomCode: string, targetPlayerUuid: string, requestingPlayerUuid: string }) => {
		const removed = setupService.removePlayer(playerData.roomCode, playerData.targetPlayerUuid, playerData.requestingPlayerUuid);

		if (removed) {
			io.to(playerData.roomCode).emit('player_disconnected', {
				playerUuid: playerData.targetPlayerUuid,
				reason: 'removed',
			});
		}
	});

	socket.on('validate_word', (inputs: { word: string }) => {
		const { word } = inputs;
		const socketData = extractSocketData(socket.data);

		if (!socketData) {
			return;
		}

		const { playerUuid, roomCode } = socketData;
		const room = database.getRoom(roomCode);

		console.log(socketData);

		if (!room) {
			// TODO: Handle ignore
			console.error('[validate_word] Invalid room code');
			return;
		}

		if (room.getState() === 'LOBBY') {
			console.error('[validate_word] Player trying to validate word in the incorrect room state');
			return;
		}

		const player = room.getPlayers().find((player) => player.uuid === playerUuid);

		if (!player) {
			console.error('[validate_word] Invalid player uuid');
			return;
		}

		if (player.wordTries.length === Room.MAX_WORDS) {
			console.log('[validate_word] Max word tries reached', `${player.wordTries.length} / ${Room.MAX_WORDS}`);
			return;
		}

		const result = validateWord(word, room.getSolution());

		player.addWord(word, result);

		const win = result.every((result) => result === WordlePoints.Exact);

		if (win) {
			console.log('PLAYER WON');
			room.setState('LOBBY');

			// TODO: Handle win
			io.to(roomCode).emit('player_win', {
				playerUuid: playerUuid,
				solution: room.getSolution(),
			});
		} else if (checkLostMatch(room, 6)) {
			socket.emit('player_win', {
				playerUuid: null,
				solution: room.getSolution(),
			});
		}

		const accumulatedResult = player.getKnownLetters();

		socket.emit('validate_word', {
			result,
		});

		io.to(roomCode).emit('player_word', {
			playerUuid: playerUuid,
			result: accumulatedResult,
		});
	});

	socket.on('start_game', (inputs: { wordListId: string }) => {
		const socketData = extractSocketData(socket.data);

		if (!socketData) {
			return;
		}

		const room = database.getRoom(socketData.roomCode);

		if (!room) {
			// TODO: Handle ignore
			console.error('[start_game] Invalid room code');
			return;
		}

		// TODO: Check the player is the host!
		room.resetPlayerScores();
		room.setWordListId(inputs.wordListId);
		room.rollWord();
		room.setState('IN-GAME');

		console.log(`START GAME REQUEST with solution: ${room.getSolution()}`);

		const startMatchDelay = room.getPlayers().length === 1
			? null
			: Date.now() + START_MATCH_DELAY;

		io.to(socketData.roomCode).emit('start_prematch', {
			startTime: startMatchDelay,
			wordListId: room.getWordListId(),
		});

		setTimeout(() => {
			io.to(socketData.roomCode).emit('on_start_game');
		}, START_MATCH_DELAY);

	});

	socket.emit('serverMessage', 'World!');
});


const database = new Database();

const setupService = new SetupService(io, database);

async function handle(request: Request, info: ConnInfo): Promise<Response> {
	const url = new URLPattern(request.url);

	if (url.pathname === '/create-room') {
		const code = generateString(6);

		return createRoom(code, setupService);
	}

	return io.handler()(request, info);
}

await serve(handle, {
	port: parseInt(configData["WS_PORT"]),
});
