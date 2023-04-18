import { Room } from './models/Room.ts';


export class Database {
	private rooms: Record<string, Room> = {};

	createRoom(roomCode: string): Room | null {
		const existingRoom = this.getRoom(roomCode);

		if (existingRoom) {
			return null;
		}

		const newRoom = new Room();
		this.rooms[roomCode] = newRoom;

		return newRoom;
	}

	getRoom(roomCode: string): Room | null {
		const existingRoom = this.rooms[roomCode];

		return existingRoom || null;
	}
}
