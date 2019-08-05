import { Price } from './price.model';

export class Product {
    constructor(
        public id: string,
        public name: string,
        public code: string,
        public available: number,
        public expDate: Date,
        public category: string,
        public price: Price
            ) {}
}
