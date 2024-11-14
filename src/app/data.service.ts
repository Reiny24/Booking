import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';  // Import map from rxjs/operators
import { Observable } from 'rxjs';  // Observable import

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  // Modify the fetchRooms method to return the observable and use map
  fetchRooms(file: string): Observable<any> {
    return this.http.get(file + '.json').pipe(
      map((res) => res)  // You can now directly return the response, no need for res.json()
    );
  }
}
