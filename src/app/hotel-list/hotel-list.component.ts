import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common'; // Import NgFor directly

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.css'
})
export class HotelListComponent {
    hotels = [
      { id: 'A', name: 'Hotel A' },
      { id: 'B', name: 'Hotel B' },
      { id: 'C', name: 'Hotel C' },
    ]; // replace with actual data from a service

    constructor(private router: Router) {}

    viewReservations(id: string) {
      this.router.navigate(['/reservations', id]);
    }
}
