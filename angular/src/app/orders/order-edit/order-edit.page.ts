import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Order } from '../order.model';
import { OrderService } from '../order.service';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { Product } from 'src/app/products/product.model';
import { ProductsService } from 'src/app/products/products.service';
import { pipe } from 'rxjs';
import { switchMap, tap, take, delay } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { ArrayValidators } from './array.validators';
import { LoadingController } from '@ionic/angular';

const accountTypes = {
  RETAILER: 'retail',
  RESELLER:   'reseller',
  CITY_DISTRIBUTOR: 'cityDistributor',
  PROVINCIAL_DISTRIBUTOR: 'provincialDistributor',
};

@Component({
  selector: 'app-order-edit',
  templateUrl: './order-edit.page.html',
  styleUrls: ['./order-edit.page.scss'],
})

export class OrderEditPage implements OnInit {
  customers;
  order: any;
  orderId: string;
  editMode = false;
  createMode = false;
  form: FormGroup;
  productOptions: any[] = [];
  isLoading = true;
  totalPrice: number;
  buyerAccount = '';
  isPaid;
  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private authService: AuthService,
    private productService: ProductsService,
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private router: Router
  ) { }

  get thisYear() {
    return (new Date()).getFullYear();
  }

  private start() {
    this.route.paramMap
      .subscribe(
      (paramMap: ParamMap) => {
        this.isLoading = true;
        if (paramMap.has('orderId')) {
          this.editMode = true;
          this.orderId = paramMap.get('orderId');
          this.orderService.getOrder(this.orderId).pipe(
            switchMap((order) => {
              this.order = order;
              this.isPaid = this.order.isPaid;
              this.totalPrice = this.order.totalPrice;
              return this.authService.users;
            }),
            switchMap((users) => {
              this.customers = users;
              this.initializeForm(
                this.order.purchaseDate,
                this.order.orderDate,
                this.order.buyer.id,
                this.order.shippingFee,
                this.order.products
              );
              return this.authService.getUser(this.order.buyer.id);
            }),
            tap((buyer: any) => {
              this.buyerAccount = accountTypes[buyer.accountType];
            })
          ).subscribe(() => {}, () => this.router.navigateByUrl('/orders'));
        } else {
          this.isLoading = true;
          this.editMode = false;
          this.authService.users.pipe(
            tap(users => {
              this.customers = users;
              this.initializeForm();
            })
          )
          .subscribe();
        }
        this.initializeForm();
      }
      );
  }
  ngOnInit() {
    this.start();
    this.productService.products.subscribe(products => {
      this.productOptions = products;
      this.isLoading = false;
    });
  }
  onChange(event) {
    this.authService.getUser(event.target.value).subscribe(buyer => this.buyerAccount = accountTypes[buyer.accountType]);
  }
  ionViewWillEnter() {
    this.start();
    this.productService.products.subscribe(products => {
      this.productOptions = products;
      this.isLoading = false;
      console.log('productOptions', this.productOptions);
    });
  }

  initializeForm(
    purchaseDate = null,
    orderDate = null,
    buyer = null,
    shippingFee = null,
    orderedProducts = null
  ) {
    this.form = this.fb.group({
      customer: [buyer, Validators.required],
      orderDate: [orderDate, Validators.required],
      purchaseDate: [purchaseDate],
      shippingFee: [shippingFee],
      products: this.fb.array(
        this.productOptions.map(product => {
          const pEl = orderedProducts ? orderedProducts.find(p => product.id === p.product.id && p.quantity >= 1) : null;
          const quantity = pEl ? pEl.quantity : null ;
          if (this.editMode) {
            return this.fb.group({
              product: product.id,
              // tslint:disable-next-line: max-line-length
              quantity: [quantity, [Validators.pattern(/^[1-9]+[0-9]*$/), Validators.minLength(1), Validators.max(this.getQuantity(product.id))]]
            });
          } else {
            return this.fb.group({
              product: product.id,
              // tslint:disable-next-line: max-line-length
              quantity: [quantity, [Validators.pattern(/^[1-9]+[0-9]*$/), Validators.minLength(1), Validators.max(product.available)]]
            });
          }
        }), ArrayValidators.minLengthArray(1)
      )
    });

    if (this.isPaid) {
      setTimeout(() => this.form.disable());
      console.log(this.form);
    }
  }

  get productsArray() {
    return this.form.get('products') as FormArray || [];
  }

  getProductDetails(id) {
    return this.productOptions.find(product => product.id === id);
  }

  // addProductArray() {
  //   this.productsArray.push(this.fb.control(''));
  // }
  getQuantity(id) {
    if (this.order) {
      const o = this.order.products.find(res => res.product.id === id);
      if (o) {
        return o.quantity + o.product.available || 0;
      }
    }
    const p = this.productOptions.find(product => product.id === id);
    return p.available;
  }
  async saveOrder() {
    if (!this.form.valid) {
      return;
    }
    const loadingEl = await this.loadingCtrl.create({message: 'Saving Order'});
    loadingEl.present();

    if (!this.editMode) {
      this.orderService.createOrder(
        this.form.value.customer,
        this.buyerAccount,
        this.form.value.products
        .filter(p => p.quantity !== null)
        .map(p => {
          const dataP = this.getProductDetails(p.product);
          return {
            ...p,
            available: dataP.available,
            price: {
              retail: dataP.price.retail,
              reseller: dataP.price.reseller,
              cityDistributor: dataP.price.cityDistributor,
              provincialDistributor: dataP.price.provincialDistributor
            }
          };
        }),
        this.form.value.orderDate,
        this.form.value.shippingFee
      ).subscribe(() => {
        this.router.navigateByUrl('/orders');
        loadingEl.dismiss();
      });
    } else {
      this.orderService.updateOrder(
        this.order,
        this.orderId,
        this.buyerAccount,
        this.form.value.customer,
        this.form.value.products
          .filter(p => p.quantity !== null)
          .map(p => {
            const dataP = this.getProductDetails(p.product);
            return {
              ...p,
              available: dataP.available,
              price: {
                retail: dataP.price.retail,
                reseller: dataP.price.reseller,
                cityDistributor: dataP.price.cityDistributor,
                provincialDistributor: dataP.price.provincialDistributor
              }
            };
          }),
        this.form.value.orderDate,
        this.form.value.shippingFee
      ).subscribe(() => {
        this.router.navigateByUrl('/orders');
        loadingEl.dismiss();
      });
    }

  }

}
