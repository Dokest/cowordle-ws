import { Socket } from 'socket.io';
import { ISocket } from './ISocket.js';

export class ConnectionSocket implements ISocket {
	handleConnection(socket: Socket) {
		socket.emit('message', 'Hi! I am a live socket connection');
	}

	middlewareImplementation(socket: Socket, next: Function) {
		return next();
	}
}
