import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { ApolloQueryResult } from 'apollo-client';
import { tap, take, map, switchMap } from 'rxjs/operators';

import { of } from 'zen-observable';
import { SharedService } from '../shared/shared.service';

@Injectable()
export class OrderService {
// tslint:disable-next-line: variable-name
  constructor(
    private apollo: Apollo,
    private sharedService: SharedService
    ) { }


  fetchOrders() {
    return this.apollo
      .query({
        query: gql`
          query orders
          {
            orders{
              id
              orderDate
              purchaseDate
              isPaid
              totalPrice
              shippingFee
              buyer{
                id
                name
                email
                accountType
              }
              createdBy{
                name
                email
              }
              products{
                  quantity
                  id
                  product{
                    id
                    name
                    code
                    available
                    expDate
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
              updatedAt
              createdAt
            }
          }
        `,
        fetchPolicy: 'network-only'
      })
      .pipe(
        map((orders: ApolloQueryResult<any>) => {
          console.log(orders);
          return orders.data.orders;
        }),
        tap((orders) => {
          this.sharedService._orders.next(orders);
        })
      );
  }

  getOrder(orderId: string) {
    return this.sharedService.orders.pipe(
      take(1),
      switchMap(orders => {
         return of(orders.find(o => o.id === orderId));
      })
    );
  }
  // getOrder(orderId: string) {
  //   return this.apollo
  //     .query({
  //       query: gql`
  //         query order($id: ID!){
  //           order(id: $id){
  //             orderDate
  //             purchaseDate
  //             isPaid
  //             totalPrice
  //             shippingFee
  //             buyer{
  //               id
  //               name
  //               email
  //               accountType
  //             }
  //             createdBy{
  //               name
  //               email
  //             }
  //             products{
  //                 quantity
  //                 id
  //                 product{
  //                   id
  //                   name
  //                   code
  //                   available
  //                   expDate
  //                   price{
  //                   retail
  //                   reseller
  //                   cityDistributor
  //                   provincialDistributor
  //                 }
  //                 }
  //             }
  //             updatedAt
  //             createdAt
  //           }
  //         }
  //       `,
  //       variables: {
  //         id: orderId
  //       },
  //       fetchPolicy: 'network-only'
  //     })
  //     // .valueChanges
  //     .pipe(
  //       map((order: ApolloQueryResult<any>) => {
  //         return order.data.order;
  //       }),
  //       tap((order) => {
  //       })
  //     );
  // }

  deleteOrder(
    orderId: string,
    orderedProducts: { product: string, quantity: number, available: number}[],
    ) {
    return this.apollo.mutate({
      mutation: gql`
        mutation deleteOrder($id: ID!, $orderedProducts: [OrderedProductInput!] ){
          deleteOrder(id: $id, orderedProducts: $orderedProducts){
            id
          }
        }
      `,
      variables: {
        id: orderId,
        orderedProducts
      }
    })
    .pipe(
      switchMap((res: any) => {
        return this.sharedService.orders;
      }),
      take(1),
      switchMap(orders => {
        this.sharedService._orders.next(orders.filter(order => order.id !== orderId));
        return this.sharedService.products;
      }),
      take(1),
      tap(allProducts => {
        console.log(allProducts);
        orderedProducts.map(adjustedCountProduct => {
          // tslint:disable-next-line: max-line-length
          allProducts[allProducts.findIndex((p: any) => p.id === adjustedCountProduct.product)].available = adjustedCountProduct.available + adjustedCountProduct.quantity;
        });
        this.sharedService._products.next(allProducts);
      })
    );
  }

  createOrder(
    customer: string,
    buyerAccount: string,
    products: { product: string, quantity: number, available: number, price: any }[],
    orderDate: string,
    shippingFee: number) {
      let createdOrder;
      return this.apollo.mutate({
        mutation: gql`
          mutation createOrder($data: CreateOrderInput!){
            createOrder(data: $data){
              id
              orderDate
              purchaseDate
              isPaid
              totalPrice
              shippingFee
              buyer{
                id
                name
                email
                accountType
              }
              createdBy{
                name
                email
              }
              products{
                  quantity
                  id
                  product{
                    id
                    name
                    code
                    available
                    expDate
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
              updatedAt
              createdAt
            }
          }
          `,
        variables: {
          data: {
            orderDate,
            buyerAccount,
            buyer: customer,
            shippingFee,
            products
          }
        }
      })
      .pipe(
        switchMap((order: any) => {
          createdOrder = order.data.createOrder;
          return this.sharedService.orders;
        }),
        take(1),
        switchMap((orders) => {
          const newOrders = orders.concat(createdOrder);
          this.sharedService._orders.next(newOrders);
          return this.sharedService.products;
        }),
        take(1),
        tap((productsRes: any[]) => {
          const productsData = productsRes.concat();
          createdOrder.products
          .map(p => p.product)
          .map(updatedProduct => {
            productsData[productsRes.findIndex(p => p.id === updatedProduct.id)] = updatedProduct;
          });
          this.sharedService._products.next(productsData);
          console.log(productsData);
        })
      );
  }

  updateOrder(
    oldOrderData,
    orderId: string,
    buyerAccount: string,
    customer: string,
    products: { product: string, quantity: number, available: number, price: any }[],
    orderDate: string,
    shippingFee: number
  ) {
    const oldProductData = oldOrderData.products.map(od => {
      return {
        orderedProduct: od.id,
        product: od.product.id,
        quantity: od.quantity,
        available: od.product.available,
        price: {
          retail: od.product.price.retail,
          reseller: od.product.price.reseller,
          cityDistributor: od.product.price.cityDistributor,
          provincialDistributor: od.product.price.provincialDistributor
        }
      };
    });
    const oldTotalPrice = oldOrderData.totalPrice;
    const oldShippingFee = oldOrderData.shippingFee;

    let updatedOrder;
    let updatedOrders;
    const productNullValue = []; // this is for state change for those with quantity before but not anymore
    for (const p of oldOrderData.products) {
      const existsInNew = products.some(newP => p.product.id === newP.product);
      if (!existsInNew) {
       const available = p.quantity + p.product.available;
       productNullValue.push({
        ...p.product,
        available
       });
      }
    }
    return this.apollo.mutate({
      mutation: gql`
        mutation updateOrder($id: ID!, $data: UpdateOrderInput!){
          updateOrder(id: $id, data: $data){
            id
              orderDate
              purchaseDate
              isPaid
              totalPrice
              shippingFee
              buyer{
                id
                name
                email
                accountType
              }
              createdBy{
                name
                email
              }
              products{
                  quantity
                  id
                  product{
                    id
                    name
                    code
                    available
                    expDate
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
              updatedAt
              createdAt
          }
        }
      `,
      variables: {
        id: orderId,
        data: {
          orderDate,
          buyer: customer,
          shippingFee,
          products,
          oldProductData,
          oldTotalPrice,
          oldShippingFee,
          buyerAccount
        }
      }
    }).pipe(
      switchMap((order: any) => {
        updatedOrder = order.data.updateOrder;
        console.log('updatedOrder', updatedOrder);
        return this.sharedService.orders;
      }),
      take(1),
      switchMap((orders) => {
        const updatedOrderIndex = orders.findIndex(ord => ord.id === orderId);
        updatedOrders = [...orders];
        updatedOrders[updatedOrderIndex] = updatedOrder;
        this.sharedService._orders.next(updatedOrders);
        return this.sharedService.products;
      }),
      take(1),
      tap((productsRes: any[]) => {
        const productsData = productsRes.concat();
        updatedOrder.products
        .map(p => p.product)
        .concat(productNullValue)
        .map(updatedProduct => {
          console.log('updatedProduct', updatedProduct);
          productsData[productsRes.findIndex(p => p.id === updatedProduct.id)] = updatedProduct;
        });
        this.sharedService._products.next(productsData);
      })
    );
  }

  processOrder(orderId: string) {
    let purchasedDate;
    return this.apollo.mutate({
      mutation: gql`
        mutation processOrder($id: ID!, $purchaseDate: DateTime!){
          processOrder(id: $id, purchaseDate: $purchaseDate){
            purchaseDate
          }
        }
      `,
      variables: {
        id: orderId,
        purchaseDate: new Date()
      }
    }).pipe(
      switchMap((res: any) => {
       purchasedDate = res.data.processOrder.purchaseDate;
       return this.sharedService.orders;
      }),
      take(1),
      tap(orders => {
        const processedOrderIndex = orders.findIndex(ord => ord.id === orderId);
        const processedOrders = [...orders];
        processedOrders[processedOrderIndex].purchaseDate = purchasedDate;
        processedOrders[processedOrderIndex].isPaid = true;
        console.log(processedOrders);
        this.sharedService._orders.next(processedOrders);
      })

    );
  }
}
