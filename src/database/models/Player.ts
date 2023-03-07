export class Player {
	readonly uuid: string = '';

	constructor(public name: string, readonly connectionTimestamp: number, uuid?: string) {
		this.uuid = uuid || crypto.randomUUID();
	}
}
