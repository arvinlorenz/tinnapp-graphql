import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../products.service';
import { Category } from '../../category.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-category-edit',
  templateUrl: './category-edit.page.html',
  styleUrls: ['./category-edit.page.scss'],
})
export class CategoryEditPage implements OnInit {
  editMode = false;
  categoryId;
  category: Category;
  form: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductsService,
    private fb: FormBuilder,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap.has('categoryId')) {
        this.editMode = true;
        this.categoryId = paramMap.get('categoryId');
        this.productService.getCategory(this.categoryId).subscribe(category => {
          this.category = category;
          this.initializeForm(
            this.category.name,
            this.category.description
          );
        });

      } else {
        this.editMode = false;
      }
      this.initializeForm();
    });
  }


  private initializeForm(
    name = '',
    description = ''
  ) {
    this.form = this.fb.group({
      name: [name, Validators.required],
      description: [description]
    });
  }
  async onSaveCategory() {
    if (!this.form.valid) {
      return;
    }
    const loadingEl = await this.loadingCtrl.create({message: 'Saving Category'});
    loadingEl.present();

    if (this.editMode) {
      this.productService.updateCategory(
        this.categoryId,
        this.form.value.name,
        this.form.value.description
      ).subscribe(res => {
        this.loadingCtrl.dismiss();
        this.router.navigateByUrl('/products/tabs/categories');
      }, err => {
        console.log(err);
        this.loadingCtrl.dismiss();
        this.router.navigateByUrl('/products/tabs/categories');
      });
    } else {
      this.productService.createCategory(
        this.form.value.name,
        this.form.value.description
      ).subscribe(res => {
        this.loadingCtrl.dismiss();
        this.router.navigateByUrl('/products/tabs/categories');
      }, err => {
        console.log(err);
        this.loadingCtrl.dismiss();
        this.router.navigateByUrl('/products/tabs/categories');
      });
    }
  }

}
