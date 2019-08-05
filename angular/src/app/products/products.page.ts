import { Component, OnInit } from '@angular/core';
import { ProductsService } from './products.service';
import { AuthService } from '../auth/auth.service';
import { Product } from './product.model';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  products: Product[];
  isLoading = true;
  constructor(
    private productsService: ProductsService,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.productsService.products.subscribe((products: any) => {
      this.isLoading = false;
      this.products = products;
    });
  }
  ionViewWillEnter() {
    this.productsService.products.subscribe((products: any) => {
      this.isLoading = false;
      this.products = products;
    });
  }
}
