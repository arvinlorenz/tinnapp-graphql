import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrdersPage } from './orders.page';

const routes: Routes = [
    {
      path: 'new',
      loadChildren: './order-edit/order-edit.module#OrderEditPageModule',
    },
    { path: ':orderId', loadChildren: './order-detail/order-detail.module#OrderDetailPageModule' },
    { path: 'edit/:orderId', loadChildren: './order-edit/order-edit.module#OrderEditPageModule',
},

    {
      path: '',
      component: OrdersPage,
    },
  ];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OrdersRoutingModule {}
