import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { ApolloQueryResult } from 'apollo-client';
import { BehaviorSubject } from 'rxjs';
import { map, tap, switchMap, take } from 'rxjs/operators';
import { Price } from './price.model';
import { Plugins } from '@capacitor/core';
import { Product } from './product.model';
import { Category } from './category.model';
import { OrderService } from '../orders/order.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  // tslint:disable-next-line: variable-name
  public _products = new BehaviorSubject<any[]>([]);
  // tslint:disable-next-line: variable-name
  public _categories = new BehaviorSubject<any[]>([]);

  // public _categories = new BehaviorSubject<{type: string, data: any[]}>({type: '', data: []});

  get products() {
    return this._products.asObservable();
  }

  get categories() {
    return this._categories.asObservable();
  }

  constructor(
    private apollo: Apollo,
    private orderService: OrderService) { }

  fetchProducts() {
    return this.apollo
      .query({
        query: gql`
          query {
            products{
            id
            name
            code
            available
            price{
              retail
              reseller
              cityDistributor
              provincialDistributor
            }
            category{
              id
              name
            }
          }
          }
      `,
         fetchPolicy: 'network-only'
      })
      // .valueChanges
      .pipe(
        map((products: ApolloQueryResult<any>) => {
          return products.data.products;
        }),
        tap((products) => {
          console.log(products);
          this._products.next(products);
        })
      );
  }

  getProduct(id: string) {
    return this.apollo.watchQuery({
      query: gql`
        query Product($id: ID!){
          product(id: $id){
            name
            code
            available
            expDate
            price {
              retail
              reseller
              cityDistributor
              provincialDistributor
            }
            category {
              id
            }
          }
        }
      `,
      variables: {
        id
      },
      fetchPolicy: 'network-only'
    })
    .valueChanges
    .pipe(
      map((productRes: any) => {
        return productRes.data.product;
      })
    );
  }
  createProduct(
    name: string,
    code: string,
    available: number,
    expDate: Date,
    category: string,
    price: Price
  ) {

    let createdProduct: Product[];
    return this.apollo
    .mutate({
      mutation: gql`
        mutation createProduct($data: SaveProductInput!)
        {
          createProduct(data: $data){
            id
            name
            code
            available
            price{
              retail
              reseller
              cityDistributor
              provincialDistributor
            }
            orderedProduct{
              id
              quantity
              order{
                isPaid
              }
            }
            category{
              id
              name
            }
          }
        }
      `,
      variables: {
        data: {
          name,
          code,
          available,
          expDate,
          category,
          price
        }
      }
    }).pipe(
      switchMap((productRes: any) => {
        createdProduct = productRes.data.createProduct;
        return this.products;
      }),
      take(1),
      switchMap(products => {
        this._products.next(products.concat(createdProduct));
        return this.categories;
      }),
      take(1),
      tap((categories: any) => {
        const categoryIndex = categories.findIndex(ct => ct.id === category);
        categories[categoryIndex].products = categories[categoryIndex].products.concat(createdProduct);
        this._categories.next(categories);
      })
    );
  }

  editProduct(
    productId: string,
    name: string,
    code: string,
    available: number,
    expDate: Date,
    category: string,
    price: Price
  ) {
    let updatedProduct: Product;
    let updatedProducts: Product[];
    return this.apollo.mutate({
      mutation: gql`
        mutation updateProduct($id: ID!, $data: SaveProductInput!){
          updateProduct(id: $id, data: $data){
            name
            code
            available
            expDate
            price {
              retail
              reseller
              cityDistributor
              provincialDistributor
            }
            category{
              name
            }
          }
        }
      `,
      variables: {
        id: productId,
        data: {
          name,
          code,
          available,
          category,
          expDate,
          price
        }
      },
    }).pipe(
      switchMap((productRes: any) => {
        updatedProduct = productRes.data.updateProduct;
        return this.products;
      }),
      take(1),
      map(products => {
        const updatedProductIndex = products.findIndex(pr => pr.id === productId);
        updatedProducts = [...products];
        updatedProducts[updatedProductIndex] = new Product(
          productId,
          updatedProduct.name,
          updatedProduct.code,
          updatedProduct.available,
          updatedProduct.expDate,
          updatedProduct.category,
          updatedProduct.price
        );
        return updatedProducts;
      }),
      tap(products => {
        this._products.next(products);
      })
    );
  }
  deleteProduct(
    id: string
  ) {
    let productPrice;
    let categoryId;

    return this.apollo
    .mutate({
      mutation: gql`
        mutation deleteProduct($id: ID!)
        {
          deleteProduct(id: $id){
            id
          }
        }
      `,
      variables: {
        id
      }
    }).pipe(
      switchMap(() => {
        return this.products;
      }),
      take(1),
      switchMap((products: Product[]) => {
        const deletedProduct: any = products.find((p: any) => p.id === id);
        productPrice = deletedProduct.price;
        categoryId = deletedProduct.category.id;
        this._products.next(products.filter(product => product.id !== id));
        return this.categories;
      }),
      take(1),
      switchMap((categories: any) => {
        const categoryIndex = categories.findIndex(ct => ct.id === categoryId);
        categories[categoryIndex].products = categories[categoryIndex].products.filter(product => product.id !== id);
        this._categories.next(categories);
        return this.orderService.orders;
      }),
      take(1),
      tap(ordersRes => {
        const orders = [...ordersRes];
        console.log(ordersRes);
      })
    );
  }


  fetchCategories() {
    return this.apollo
      .query({
        query: gql`
          query {
            categories{
              id
              name
              products{
                id
                name
              }
            }
            }
      `,
         fetchPolicy: 'network-only'
      })
      // .valueChanges
      .pipe(
        map((categories: ApolloQueryResult<any>) => {
          return categories.data.categories;
        }),
        tap((categories) => {
          this._categories.next(categories);
        })
      );
  }


  createCategory(
    categoryName: string,
    categoryDescription: string
  ) {
    let createdCategory;
    return this.apollo
    .mutate({
      mutation: gql`
         mutation createCategory($data: SaveCategoryInput!){
          createCategory(data: $data){
           id
           name
           description
           products{
             id
           }
          }
        }
      `,
      variables: {
        data: {
          name: categoryName,
          description: categoryDescription
        }
      }
    })
    .pipe(
      switchMap((categoryRes: any) => {
        createdCategory = categoryRes.data.createCategory;
        return this.categories;
      }),
      take(1),
      tap((categories) => {
        this._categories.next(categories.concat(createdCategory));
      })
    );
  }

  updateCategory(
    categoryId: string,
    categoryName: string,
    categoryDescription: string
  ) {
    let updatedCategory;
    let updatedCategories;
    return this.apollo
    .mutate({
      mutation: gql`
         mutation updateCategory($id: ID!, $data: SaveCategoryInput!){
          updateCategory(id: $id, data: $data){
           id
          }
        }
      `,
      variables: {
        id: categoryId,
        data: {
          name: categoryName,
          description: categoryDescription
        }
      }
    })
    .pipe(
      switchMap((categoryRes: any) => {
        updatedCategory = categoryRes.data.updateCategory;
        return this.categories;
      }),
      take(1),
      map(categories => {
        const updatedCategoryIndex = categories.findIndex(ct => ct.id === categoryId);
        updatedCategories = [...categories];
        updatedCategories[updatedCategoryIndex] = {
          name: updatedCategory.name,
          description: updatedCategory.description
        };
        return updatedCategories;
        }),
      tap(categories => {
        this._categories.next(categories);
      })
    );
  }

  deleteCategory(id: string) {
    return this.apollo.mutate({
      mutation: gql`
        mutation deleteCategory($id: ID!){
          deleteCategory(id: $id){
            id
          }
        }
      `,
      variables: {
        id
      }
    }).pipe(
      switchMap(() => {
        return this.categories;
      }),
      take(1),
      switchMap((categories: Category[]) => {
        this._categories.next(categories.filter(category => category.id !== id));
        return this.products;
      }),
      take(1),
      tap(products => {
        const updatedProducts = products.filter(p => p.category.id !== id);
        this._products.next(updatedProducts);
      })
    );
  }

  getCategory(id: string) {
    return this.apollo
    .watchQuery({
      query: gql`
        query category($id: ID!){
          category(id: $id){
            name
            description
          }
        }
      `,
      variables: {
        id
      },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map((categoryRes: any) => {
        return categoryRes.data.category;
      })
    );
  }
}
