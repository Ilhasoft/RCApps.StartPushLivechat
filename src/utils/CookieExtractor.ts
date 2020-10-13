export default class CookieExtractor {

    constructor(private readonly cookiesString: string) { }

    public getCookie(name: string) {
        const cookies = this.cookiesString.split('; ');
        const result = {};
        for (const cookie of cookies) {
            const current = cookie.split('=');
            result[current[0]] = current[1];
        }

        return result[name];
    }

}
