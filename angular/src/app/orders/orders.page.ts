import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Order } from './order.model';
import { SegmentChangeEventDetail } from '@ionic/core';
import { LoadingController } from '@ionic/angular';
import { SharedService } from '../shared/shared.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {

  ordersSub: Subscription;
  orders: Order[];
  allOrders: Order[];
  isLoading = true;

  previousFilter = 'current';
  filter = 'current';
  isPaidFilter;

  constructor(
    private sharedService: SharedService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.ordersSub = this.sharedService.orders
      .subscribe(orders => {
        this.isPaidFilter = this.filter === 'current' ? false : true;
        this.isLoading = false;
        this.allOrders = orders;
        this.orders = orders.filter(o => o.isPaid === this.isPaidFilter);
      });
  }
  ionViewWillEnter() {
    this.ordersSub = this.sharedService.orders
    .subscribe(orders => {
      this.isPaidFilter = this.filter === 'current' ? false : true;
      this.isLoading = false;
      this.allOrders = orders;
      this.orders = orders.filter(o => o.isPaid === this.isPaidFilter);
    });
  }

  ngOnDestroy() {
    if (this.ordersSub) {
      this.ordersSub.unsubscribe();
    }
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    this.isLoading = true;
    if (event.detail.value === 'current') {
      this.filter = 'current';
      this.orders = this.allOrders.filter((o: any) => o.isPaid === false);
      this.isLoading = false;

    } else {
      this.filter = 'history';
      this.orders = this.allOrders.filter((o: any) => o.isPaid === true);
      this.isLoading = false;

    }
  }
}
