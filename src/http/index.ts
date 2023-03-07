import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Database } from '../database/Database.js';
import { SetupService } from '../ws/services/SetupService.js';
import { validateWord, WordlePoints } from '../ws/services/WordleService.js';


const port = 9000;

const app: Express = express();


app.get('/', (req: Request, res: Response) => {
	res.send('Express + TypeScript Server');
});

app.get('/create-room', (req: Request, res: Response) => {
	const roomCode = req.query['code'];

	if (typeof roomCode !== 'string') {
		res.json({
			error: 'invalid-argument-code',
		});

		return;
	}

	const created = setupService.createRoom(roomCode);

	if (created) {
		res.json({
			data: {},
		});

		return;
	}

	res.status(500).json({
		error: {}
	});
});

const httpServer = createServer(app);

httpServer.listen(port, () => {
	console.log(`⚡️[server]: is running at http://localhost:${port}`);
});


//const wsServer = new WebsocketServer(httpServer);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
		credentials: true,
	},
});

const database = new Database();

const setupService = new SetupService(io, database);


io.on('connect_error', (err) => {
	console.log(`connect_error due to ${err.message}`);
});

io.on('connection', (socket) => {
	console.log(`CONNECTION:`, socket.id);

	socket.on('message', (data) => {
		console.log('Message received:', data);

		socket.emit('message', `Server replies: ${data}`);
	});

	socket.on('ping', (data) => {
		console.log('Received ping from:', socket.id);

		socket.emit('ping');
	});

	socket.on('setup', (setupData: { roomCode: string; playerName: string; }) => {
		console.log(setupData);

		setupService.connectToRoom(socket, setupData.roomCode, setupData.playerName);
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

	socket.on('validate_word', (inputs: { roomCode: string, playerUuid: string, word: string }) => {
		const { playerUuid, roomCode, word } = inputs;
		const room = database.getRoom(roomCode);

		if (!room) {
			// TODO: Handle ignore
			console.error('[validate_word] Invalid room code');
			return;
		}

		const player = room.getPlayers().find((player) => player.uuid === playerUuid);

		if (!player) {
			console.error('[validate_word] Invalid player uuid');
			return;
		}

		const result = validateWord(word, room.getSolution());

		const win = result.every((result) => result === WordlePoints.Exact);

		if (win) {
			console.log('PLAYER WON');

			// TODO: Handle win
		}

		io.to(roomCode).emit('player_word', {
			playerUuid: playerUuid,
			result,
		});

		socket.emit('validate_word', {
			result,
		});
	});

	socket.on('start_game', (inputs: { playerUuid: string; roomCode: string; }) => {
		const room = database.getRoom(inputs.roomCode);

		if (!room) {
			// TODO: Handle ignore
			console.error('[validate_word] Invalid room code');
			return;
		}

		// TODO: Check the player is the host!

		console.log('START GAME REQUEST');

		io.to(inputs.roomCode).emit('on_start_game');
	});

	socket.emit('serverMessage', 'World!');
});
