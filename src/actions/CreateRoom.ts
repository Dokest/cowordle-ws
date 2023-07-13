import { SetupService } from "../ws/services/SetupService.ts";


export function createRoom(roomCode: string, setupService: SetupService): unknown {
	if (typeof roomCode !== 'string') {
		return {
			error: 'invalid-argument-code',
		};
	}

	const created = setupService.createRoom(roomCode);

	console.log('ROOM CREATED: ', !!created);

	if (!created) {
		return {
			error: {},
		};
	}

	return {
		data: {
			code: roomCode,
		},
	};
}
