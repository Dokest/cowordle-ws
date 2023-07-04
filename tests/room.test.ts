import { assertEquals } from "https://deno.land/std@0.150.0/testing/asserts.ts";
import { Player } from "../src/database/models/Player.ts";
import { Room } from "../src/database/models/Room.ts";


Deno.test('Room::addPlayer: player is added to the room', () => {
	const room = new Room();

	room.addPlayer(new Player('player1', Date.now()));

	assertEquals(room.getPlayers().length, 1);
});


Deno.test('Room::removePlayer: player is remove from the room', () => {
	const room = new Room();

	const playerUuid = crypto.randomUUID();

	room.addPlayer(new Player('player1', Date.now()));
	room.addPlayer(new Player('player2', Date.now(), playerUuid));

	room.removePlayer(playerUuid);

	assertEquals(room.getPlayers().length, 1);
});
