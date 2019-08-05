import { Component, OnInit } from '@angular/core';
import { OrderService } from '../order.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Order } from '../order.model';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
})
export class OrderDetailPage implements OnInit {
  order: Order;
  constructor(private orderService: OrderService, private route: ActivatedRoute) { }

  ngOnInit() {

    this.route.paramMap
      .subscribe(
      (paramMap: ParamMap) => {
        if (paramMap.has('orderId')) {
          const orderId = paramMap.get('orderId');
          this.orderService.getOrder(orderId).subscribe(order => {
            this.order = order;
          });
        }
      }
      );
  }

}
