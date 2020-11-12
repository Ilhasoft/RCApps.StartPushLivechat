import IAppRepository from '../data/app/IAppRepository';

export default class URNValidator {

    public async validateURN(appRepo: IAppRepository, urn: string): Promise<[boolean, string, string | undefined]> {
        const [scheme, specific] = urn.split(':');

        // by now, only whatsapp has a unique urn validation
        if (scheme === 'whatsapp') {
            return await this.validateWhatsAppURN(appRepo, urn);
        }

        const contact = await appRepo.getContact(urn);
        const contactName = contact ? contact.name : undefined;
        return [true, urn, contactName];

    }

    private async validateWhatsAppURN(appRepo: IAppRepository, urn: string): Promise<[boolean, string, string | undefined]> {

        let contact = await appRepo.getContact(urn);
        let isValid = contact ? true : false;
        let contactName = contact ? contact.name : undefined;
        if (isValid) {
            return [true, urn, contactName];
        }

        // segunda tentativa
        const [scheme, specific] = urn.split(':');
        const countryCodeAndDDD = specific.substring(0, 4);
        const contactNumber = specific.substring(4);
        if (contactNumber.length === 9) {
            urn = `${scheme}:${countryCodeAndDDD}${contactNumber.substring(1)}`;
        } else {
            urn = `${scheme}:${countryCodeAndDDD}9${contactNumber}`;
        }

        contact = await appRepo.getContact(urn);
        isValid = contact ? true : false;

        contactName = contact ? contact.name : undefined;

        return [isValid, urn, contactName];
    }
}
