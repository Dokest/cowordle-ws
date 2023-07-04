import { assertEquals } from "https://deno.land/std@0.150.0/testing/asserts.ts";
import { Server, Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Database } from "../src/database/Database.ts";
import { Room } from "../src/database/models/Room.ts";
import { SetupService } from "../src/ws/services/SetupService.ts";


Deno.test('SetupService::connectToRoom: player is connected to the room', async () => {
	const room = new Room();

	const io = {
		to: () => io,
		emit: async () => undefined,
	} as unknown as Server;

	const setupService = new SetupService(io, {
		getRoom: () => room,
	} as unknown as Database);

	const socket = {
		join: async () => undefined,
		emit: async () => undefined,
	} as unknown as Socket;

	await setupService.connectToRoom(socket, '', '');

	assertEquals(room.getPlayers().length, 1);
});
