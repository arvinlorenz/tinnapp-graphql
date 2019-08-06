import { Component, OnInit } from '@angular/core';
import { Category } from '../category.model';
import { SharedService } from 'src/app/shared/shared.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
})
export class CategoriesPage implements OnInit {

  categories: Category[];
  isLoading = true;
  constructor(
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.sharedService.categories.subscribe(categories => {
        this.isLoading = false;
        this.categories = categories;
      });
  }

  ionViewWillEnter() {
    this.sharedService.categories.subscribe(categories => {
        this.isLoading = false;
        this.categories = categories;
      });
  }

}
