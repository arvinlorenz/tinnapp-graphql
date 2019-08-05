import { Product } from '../products/product.model';

export class Order {
    constructor(
        public id: string,
        public orderDate: Date,
        public shippingFee: number,
        public totalPrice: number,
        public products: Product
    ) {}
}
