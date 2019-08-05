import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full'
  },
  {
    path: 'orders',
    loadChildren: './orders/orders.module#OrdersPageModule',
    canLoad: [AuthGuard]
  },
  { path: 'products', loadChildren: './products/products.module#ProductsPageModule', canLoad: [AuthGuard] },
  { path: 'auth', loadChildren: './auth/auth.module#AuthPageModule' },
  { path: 'product-edit', loadChildren: './products/product-edit/product-edit.module#ProductEditPageModule', canLoad: [AuthGuard] },
  { path: 'product-detail', loadChildren: './products/product-detail/product-detail.module#ProductDetailPageModule', canLoad: [AuthGuard] },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
