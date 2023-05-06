import { Room } from "../database/models/Room.ts";

export function checkLostMatch(room: Room, maxTries: number): boolean {
	return room.getPlayers().every((player) => {
		return player.wordTries.length === maxTries;
	});
}
