import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';

export default class CommandError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, CommandError.prototype);
    }
}
