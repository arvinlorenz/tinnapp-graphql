import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // tslint:disable-next-line: variable-name
  public _orders = new BehaviorSubject<any>([]);
  // tslint:disable-next-line: variable-name
  public _products = new BehaviorSubject<any[]>([]);
  // tslint:disable-next-line: variable-name
  public _categories = new BehaviorSubject<any[]>([]);

  constructor() { }

  get orders() {
    return this._orders.asObservable();
  }

  get products() {
    return this._products.asObservable();
  }

  get categories() {
    return this._categories.asObservable();
  }
}
