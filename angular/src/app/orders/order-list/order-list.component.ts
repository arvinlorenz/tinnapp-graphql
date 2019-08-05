import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { OrderService } from '../order.service';
import { Subscription } from 'rxjs';
import { Order } from '../order.model';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

const accountTypes = {
  RETAILER: 'retail',
  RESELLER:   'reseller',
  CITY_DISTRIBUTOR: 'cityDistributor',
  PROVINCIAL_DISTRIBUTOR: 'provincialDistributor',
};

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
})

export class OrderListComponent implements OnInit {

  @Input() orders: any[];
  ordersSub: Subscription;
  constructor(
    private orderService: OrderService,
    private router: Router,
    private loadingCtrl: LoadingController) { }

  ngOnInit() {
  }

  async process(orderId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    const loadingEl = await this.loadingCtrl.create({message: 'Processing Order...'});
    loadingEl.present();
    this.orderService.processOrder(orderId).subscribe(() => {
      loadingEl.dismiss();
      this.router.navigateByUrl('/orders');
    }, () => {
      loadingEl.dismiss();
    });
  }
  onEdit(orderId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['/', 'orders', 'edit', orderId]);
  }

  async onDelete(orderId: string, slidingItem: IonItemSliding) {
    const order = this.orders.find(o => o.id === orderId);
    const products = order.products.map(p => {
      return {
        product: p.product.id,
        available: p.product.available,
        quantity: p.quantity
      };
    });
    slidingItem.close();
    const loadingEl = await this.loadingCtrl.create({message: 'Deleting Order...'});
    loadingEl.present();

    this.orderService.deleteOrder(orderId, products)
    .subscribe(() => {
      loadingEl.dismiss();
      this.router.navigateByUrl('/orders');
    }, () => {
      loadingEl.dismiss();
    });
  }
}
