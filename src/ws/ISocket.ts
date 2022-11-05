import { Socket } from 'socket.io';


export interface ISocket {
	handleConnection(socket: Socket): void;

	middlewareImplementation?(socket: Socket, next: any): void
}
