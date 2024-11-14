import { Routes } from '@angular/router';
import { HotelListComponent } from './hotel-list/hotel-list.component';
import { RoomReservationsComponent } from './room-reservations/room-reservations.component';

export const routes: Routes = [
    { path: '', component: HotelListComponent },
    { path: 'reservations/:id', component: RoomReservationsComponent }
];
