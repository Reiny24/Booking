import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common';
import { DataService } from '../data.service';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.css',
  providers: [DataService],
})

export class HotelListComponent {
    hotels: string[] = [];

    constructor(
      private router: Router,
      private dataService: DataService
    ) {}

    ngOnInit() {
      this.dataService.fetch('http://localhost:8080/home').subscribe((data) => {
        this.hotels = data.map((hotel: any) => hotel.roomBuilding);
        console.log(this.hotels);  // Check the result in the console
      });
    }

    viewReservations(id: string) {
      this.router.navigate(['/reservations', id]);
    }
}
