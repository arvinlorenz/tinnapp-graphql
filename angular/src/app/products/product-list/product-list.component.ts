import { Component, OnInit, Input } from '@angular/core';
import { ProductsPage } from '../products.page';
import { Product } from '../product.model';
import { Router } from '@angular/router';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  @Input() products: Product[];
  constructor(
    private router: Router,
    private productService: ProductsService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
  }

  onEdit(productId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['/', 'products', 'tabs', 'items', productId]);
  }

  async onDelete(productId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    const loadingEl = await this.loadingCtrl.create({message: 'Deleting Product...'});
    loadingEl.present();

    this.productService.deleteProduct(productId).subscribe(() => {
      loadingEl.dismiss();
    }, () => {
      loadingEl.dismiss();
    });
  }
}
