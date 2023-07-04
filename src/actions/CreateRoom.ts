import { SetupService } from "../ws/services/SetupService.ts";


export function createRoom(roomCode: string, setupService: SetupService): Response {
	if (typeof roomCode !== 'string') {
		return Response.json({
			error: 'invalid-argument-code',
		});
	}

	const created = setupService.createRoom(roomCode);

	console.log('ROOM CREATED: ', !!created);

	if (!created) {
		return Response.json({
			error: {}
		}, {
			status: 500,
		});
	}

	return Response.json({
		data: {
			code: roomCode,
		},
	});
}
