import { Component, OnInit } from '@angular/core';
import { ProductsService } from './products.service';
import { AuthService } from '../auth/auth.service';
import { Product } from './product.model';
import { LoadingController } from '@ionic/angular';
import { SharedService } from '../shared/shared.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  products: Product[];
  isLoading = true;
  constructor(
    private sharedService: SharedService,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.sharedService.products.subscribe((products: any) => {
      this.isLoading = false;
      this.products = products;
    });
  }
  ionViewWillEnter() {
    this.sharedService.products.subscribe((products: any) => {
      this.isLoading = false;
      this.products = products;
    });
  }
}
