import { Component, OnInit } from '@angular/core';
import { Category } from '../category.model';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
})
export class CategoriesPage implements OnInit {

  categories: Category[];
  isLoading = true;
  constructor(
    private productsService: ProductsService
  ) { }

  ngOnInit() {
    this.productsService.categories.subscribe(categories => {
        this.isLoading = false;
        this.categories = categories;
      });
  }

  ionViewWillEnter() {
    this.productsService.categories.subscribe(categories => {
        this.isLoading = false;
        this.categories = categories;
      });
  }

}
