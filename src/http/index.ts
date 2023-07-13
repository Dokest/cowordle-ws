import { load } from "https://deno.land/std/dotenv/mod.ts";
import { SocketServer, createServer, express } from "../../dependencies/socketio.deps.ts";
import { checkLostMatch } from "../actions/CheckLostMatch.ts";
import { createRoom } from "../actions/CreateRoom.ts";
import { disconnectPlayer } from "../actions/DisconnectPlayer.ts";
import { reconnectPlayer } from "../actions/ReconnectPlayer.ts";
import { extractSocketData } from "../actions/SocketData.ts";
import { Database } from "../database/Database.ts";
import { Room } from "../database/models/Room.ts";
import { SetupService } from "../ws/services/SetupService.ts";
import { WordlePoints, validateWord } from "../ws/services/WordleService.ts";


const START_MATCH_DELAY = 4000;

await load({ export: true });
const webappPort = parseInt(Deno.env.get("WEBAPP_PORT") || '');
const externalWebappDomain = Deno.env.get("WEBAPP_EXTERNAL_URL");

const corsAllowedDomains = [
	`http://localhost:${webappPort}`,
];

if (externalWebappDomain) {
	corsAllowedDomains.push(externalWebappDomain);
}

console.log(corsAllowedDomains);

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
	connectionStateRecovery: {},
	cors: {
		origin: corsAllowedDomains,
		methods: ["GET", "POST", "OPTIONS"],
		credentials: true,
	},
	// deno-lint-ignore no-explicit-any
} as any);

// const io = new SocketServer({
// 	cors: {
// 		origin: corsAllowedDomains,
// 		methods: ["GET", "POST", "OPTIONS"],
// 		credentials: true,
// 	},
// });

export function generateString(length: number): string {
	return (+new Date * Math.random()).toString(36).substring(0, length).toUpperCase();
}


io.on('connect_error', (err) => {
	console.log(`connect_error due to ${err.message}`);
});

io.on('connection', (socket) => {
	console.log(`New connection: ${socket.id}. Recovering state: ${socket.recovered} with ${JSON.stringify(socket.data)}`);

	if (socket.recovered) {
		const socketData = extractSocketData(socket.data);

		reconnectPlayer(database, socket, io, {
			playerUuid: socketData?.playerUuid,
			roomCode: socketData?.roomCode,
		});
	}

	socket.on('disconnect', (reason) => {
		disconnectPlayer(database, reason, socket, io);
	});

	socket.on('heartbeat_keepalive', () => {
		socket.emit('heartbeat_keepalive');
	});

	socket.on('setup', async (setupData: { roomCode: string; playerName: string; lastPlayerUuid: string }) => {
		let hasReconnected = false;

		if (setupData.lastPlayerUuid) {
			// Try to reconnect player
			hasReconnected = reconnectPlayer(database, socket, io, {
				playerUuid: setupData.lastPlayerUuid,
				roomCode: setupData.roomCode,
			});
		}

		const reusePlayerUuid = hasReconnected
			? setupData.lastPlayerUuid
			: undefined;

		// Create new player in room
		await setupService.connectToRoom(socket, setupData.roomCode, setupData.playerName, reusePlayerUuid);

		console.log(`Setup: Player [${setupData.playerName}] reconnection [${hasReconnected}]`);
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

		if (!room) {
			// TODO: Handle ignore
			console.error('[validate_word] Invalid room code');
			return;
		}

		if (room.getState() === 'LOBBY') {
			console.error('[validate_word] Player trying to validate word in the incorrect room state');
			return;
		}

		const player = room.findPlayer(playerUuid);

		if (!player) {
			console.error('[validate_word] Invalid player uuid');
			return;
		}

		if (player.wordTries.length === Room.MAX_WORDS) {
			console.log('[validate_word] Max word tries reached', `${player.wordTries.length} / ${Room.MAX_WORDS}`);
			return;
		}

		console.log(`Player [${playerUuid}] trying word "${word}. The solution is ${room.getSolution()}"`);

		const result = validateWord(word.toUpperCase(), room.getSolution().toUpperCase());

		player.addWord(word, result);

		const win = result.every((result) => result === WordlePoints.Exact);

		if (win) {
			console.log(`Player [${socketData.playerUuid}] won.`);

			room.setState('LOBBY');

			io.to(roomCode).emit('player_win', {
				playerUuid: playerUuid,
				solution: room.getSolution(),
			});
		} else if (checkLostMatch(room, 6)) {
			console.log(`All players in room [${socketData.roomCode}] lost`);

			io.to(roomCode).emit('player_win', {
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
			console.error('[start_game] Invalid room code');
			return;
		}

		// Check the player is the host
		if (room.getHost()?.uuid !== socketData.playerUuid) {
			console.error('[start_game] Invalid user request to start the match');
			return;
		}

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

// const routes: Record<string, (request: Request) => Response | Promise<Response>> = {
// 	'/create-room': () => {
// 		const code = generateString(6);

// 		console.log('Creating new room with CODE: ', code);

// 		return createRoom(code, setupService);
// 	},
// 	'/testing/solution': async (request: Request): Promise<Response> => {
// 		console.log(request);

// 		const req = await request.json();

// 		const roomCode = req.roomCode;

// 		const room = database.getRoom(roomCode);

// 		return Response.json({
// 			solution: room?.getSolution(),
// 		});
// 	},
// }

// async function handle(request: Request, info: ConnInfo): Promise<Response> {
// 	const url = new URLPattern(request.url);

// 	if (url.pathname in routes) {
// 		return routes[url.pathname](request);
// 	}

// 	return io.handler()(request, info);
// }

// await serve(handle, {
// 	port: parseInt(configData["WS_PORT"]),
// });

app.get("/create-room", (req, res) => {
	const code = generateString(6);

	console.log('Creating new room with CODE: ', code);

	res.send(createRoom(code, setupService));
});

const port = Deno.env.has("WS_PORT") ? Deno.env.get("WS_PORT") : 9000;

server.listen(port, () => {
	console.log(`Listening on port: ${port}`);
});
