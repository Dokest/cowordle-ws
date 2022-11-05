import crypto from "crypto";

export class Player {
	readonly uuid: string = '';

	constructor(public name: string, uuid?: string) {
		this.uuid = uuid || crypto.randomUUID();
	}
}
