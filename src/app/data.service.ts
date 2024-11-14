import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';  // Import map from rxjs/operators
import { Observable } from 'rxjs';  // Observable import
import { HttpHeaders } from '@angular/common/http';

interface Guest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface Company {
  companyName: string;
  companyEmail: string;
  companyPhoneNumber: string;
}

@Injectable({
  providedIn: 'root'
})

export class DataService {
  constructor(private http: HttpClient) { }

  fetch(url: string):  Observable<any> {
    return this.http.get(url).pipe(
      map((res) => res)
    );
  }

  postBooking(roomNumber: number, hotel: string, checkinDate: string, checkoutDate: string, guest: Guest, company: Company): Observable<any> {
    const bookingData = {
      room: {
        roomId: {
          roomNumber: roomNumber,
          roomBuilding: hotel,
        }
      },
      checkinDate: checkinDate,
      checkoutDate: checkoutDate,
      guest: guest,
      company: company
    };
    
    console.log(bookingData)

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
  
    // Return the Observable so we can subscribe to it in the component
    return this.http.post('http://localhost:8080/booking', bookingData, { headers });
  }

  delete(id: string) {
    return this.http.delete('http://localhost:8080/booking/' + id);
  }

  put(id: string, roomNumber: number, hotel: string, checkinDate: string, checkoutDate: string, guest: Guest, company: Company): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const bookingData = {
      room: {
        roomId: {
          roomNumber: roomNumber,
          roomBuilding: hotel,
        }
      },
      checkinDate: checkinDate,
      checkoutDate: checkoutDate,
      guest: guest,
      company: company
    };
    return this.http.put(`http://localhost:8080/booking/${id}`, bookingData);
  }
}
