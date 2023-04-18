import { Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";


export interface SocketData {
	roomCode: string;
	playerUuid: string
}


export function extractSocketData(socketData: Partial<unknown>): SocketData | null {
	if ("roomCode" in socketData && "playerUuid" in socketData) {
		return {
			roomCode: socketData.roomCode as string,
			playerUuid: socketData.playerUuid as string,
		};
	}

	return null;
}


export function setSocketData(socket: Socket, data: SocketData): void {
	socket.data = data;
}
