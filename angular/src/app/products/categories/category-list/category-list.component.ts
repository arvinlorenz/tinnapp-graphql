import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../../category.model';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { ProductsService } from '../../products.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
})
export class CategoryListComponent implements OnInit {

  @Input() categories: Category[];
  constructor(
    private productService: ProductsService,
    private loadingCtrl: LoadingController,
    private router: Router
  ) { }

  ngOnInit() {}

  onEdit(categoryId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigateByUrl('/products/tabs/categories/' + categoryId);
  }

  async onDelete(categoryId, slidingItem: IonItemSliding) {
    slidingItem.close();
    const loadingEl = await this.loadingCtrl.create({message: 'Deleting Category...'});
    loadingEl.present();

    this.productService.deleteCategory(categoryId).subscribe(() => {
      loadingEl.dismiss();
    }, () => {
      loadingEl.dismiss();
    });
  }
}
