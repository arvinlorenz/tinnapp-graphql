import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ProductsPage } from './products.page';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductItemComponent } from './product-item/product-item.component';
import { HomePage } from './product-home/home.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: HomePage,
    children: [
      {
        path: 'items',
        children: [
          {
            path: '',
            component: ProductsPage
          },
          {
            path: 'new',
            loadChildren: './product-edit/product-edit.module#ProductEditPageModule'
          },
          {
            path: 'edit/:productId',
            loadChildren: './product-edit/product-edit.module#ProductEditPageModule'
          },
          {
            path: ':productId',
            // loadChildren: './product-detail/product-detail.module#ProductDetailPageModule'
            loadChildren: './product-edit/product-edit.module#ProductEditPageModule'
          },
        ]
      },
      {
        path: 'categories',
        children: [
          {
            path: '',
            loadChildren: './categories/categories.module#CategoriesPageModule'
          },
          {
            path: 'new',
            loadChildren: './categories/category-edit/category-edit.module#CategoryEditPageModule'
          },
          {
            path: ':categoryId',
            loadChildren: './categories/category-edit/category-edit.module#CategoryEditPageModule'
          }
        ]
      },
      {
        path: '',
        redirectTo: '/products/tabs/items',
        pathMatch: 'full'
      },
    ]
  },
  {
    path: '',
    redirectTo: '/products/tabs/items',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [HomePage, ProductsPage, ProductListComponent, ProductItemComponent]
})
export class ProductsPageModule {}
