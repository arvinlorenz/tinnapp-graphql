import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersPage } from './orders.page';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderItemComponent } from './order-item/order-item.component';
import { OrdersRoutingModule } from './orders-routing.module';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersRoutingModule
  ],
  declarations: [
    OrdersPage,
    OrderListComponent,
    OrderItemComponent
  ]
})
export class OrdersPageModule {}
