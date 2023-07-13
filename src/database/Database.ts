import { Room } from './models/Room.ts';


export class Database {
	private rooms: Map<string, Room> = new Map();


	createRoom(roomCode: string): Room | null {
		const existingRoom = this.getRoom(roomCode);

		if (existingRoom) {
			return null;
		}

		const newRoom = new Room();
		this.rooms.set(roomCode, newRoom);

		return newRoom;
	}


	getRoom(roomCode: string): Room | null {
		const existingRoom = this.rooms.get(roomCode);

		return existingRoom || null;
	}


	destroyRoom(roomCode: string): boolean {
		const room = this.getRoom(roomCode);

		if (!room) {
			return false;
		}

		this.rooms.delete(roomCode);

		return true;
	}
}
