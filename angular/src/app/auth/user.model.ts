export class User {
    constructor(
        public id: string,
        public name: string,
        public email: string,
// tslint:disable-next-line: variable-name
        public token: string,
        public accountType: string
    ) {}
}
