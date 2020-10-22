export default class CookieExtractor {

    private cookies: {[key: string]: string};

    constructor(cookiesString: string) {
        const cookiesSplit = cookiesString.split('; ');
        this.cookies = {};
        for (const cookie of cookiesSplit) {
            const current = cookie.split('=');
            if (current.length !== 2) {
                throw new Error('Could not split cookie string, due to invalid format');
            }
            this.cookies[current[0]] = current[1];
        }
    }

    public getCookie(name: string) {
        return this.cookies[name];
    }

}
