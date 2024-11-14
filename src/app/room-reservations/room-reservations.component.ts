import { Component, OnInit } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, push } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZAFLdmpYpI1eXysmtchFUIrJX7xLq6M8",
  authDomain: "hotels-booking-ec825.firebaseapp.com",
  databaseURL: "https://hotels-booking-ec825-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hotels-booking-ec825",
  storageBucket: "hotels-booking-ec825.firebasestorage.app",
  messagingSenderId: "811818691167",
  appId: "1:811818691167:web:fe7c79ea70f20d7eddc9ea",
  measurementId: "G-PK70E9312H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

interface Booking {
  room: number;
  checkinDate: string;  // Change to string
  checkoutDate: string; // Change to string
  name: string;
}

interface Room {
  number: number;
  type: string; // тип кімнати (звичайна, преміум, бізнес)
  capacity: number; // кількість спальних місць
  price: number; // ціна
}

@Component({
  selector: 'app-room-reservations',
  standalone: true,
  imports: [NgFor, NgClass, FormsModule, NgIf], // Додано FormsModule
  templateUrl: './room-reservations.component.html',
  styleUrls: ['./room-reservations.component.css'],
  providers: [DataService]
})
export class RoomReservationsComponent implements OnInit {
  hotelId!: string;
  rooms: Room[] = [];
  days: string[] = [];
  currentDayCount: number = 30;
  bookings: Booking[] = [];
  selectedDates: string[] = [];
  selectedRoom: number | null = null;
  filter: {
    type: string | null;
    capacity: number | null;
    price: { min: number, max: number };
    dateRange: { start: string | null, end: string | null };
  } = {
    type: null,
    capacity: null,
    price: { min: 0, max: 1000 },
    dateRange: { start: null, end: null }
  };

  
  userName: string = '';

  constructor(private route: ActivatedRoute, private dataService: DataService) {}
  
  ngOnInit() {
    this.hotelId = this.route.snapshot.paramMap.get('id')!;
    this.addDays(); // Ініціалізація перших днів
    this.dataService.fetchRooms('rooms').subscribe(
      (data) => this.rooms = data
    );
    this.fbGetData();
  }

  addDays() {
    const startDate = new Date();
    const start = this.days.length;
    const end = start + this.currentDayCount;

    for (let i = start; i < end; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.days.push(this.formatDate(date));
    }
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollWidth - element.scrollLeft === element.clientWidth) {
      this.addDays(); // Додаємо нові дні при досягненні кінця скролу
    }
  }

  isRoomReserved(room: number, date: string): boolean {
    const checkDate = new Date(date);
    return this.bookings.some(
      booking =>
        booking.room === room &&
        checkDate.getTime() >= new Date(booking.checkinDate).getTime() &&
        checkDate.getTime() <= new Date(booking.checkoutDate).getTime()
    );
  }

  onSelectDate(date: string, room: number) {
    if (this.isRoomReserved(room, date) || (this.selectedRoom && this.selectedRoom != room)) {
      return; // Не дозволяємо вибір зарезервованих клітинок
    }

    const index = this.selectedDates.indexOf(date);
    if (index === -1) {
      this.selectedDates.push(date); // Додаємо дату до вибраних
    } else {
      this.selectedDates.splice(index, 1); // Вилучаємо дату з вибраних
    }

    this.selectedDates.sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime(); // Сортування по даті
    });

    // Автоматично вибираємо номер кімнати на основі клітинки
    this.selectedRoom = room;
    if (this.selectedDates.length === 0) {
      this.selectedRoom = null
    }
    console.log(this.selectedDates.length, !this.isSelectedRoom(room), this.selectedRoom !== null)
  }

  bookRoom() {
    if (!this.selectedRoom || !this.selectedDates.length || !this.userName) {
      alert('Будь ласка, виберіть кімнату, дати та введіть своє ім\'я!');
      return;
    }

    const checkinDate = new Date(this.selectedDates[0]);
    const checkoutDate = new Date(this.selectedDates[this.selectedDates.length - 1]);

    if (this.isRoomAvailableForDateRange(this.selectedRoom, String(checkinDate), String(checkoutDate))) {
      this.bookings.push({
        room: this.selectedRoom,
        checkinDate: String(checkinDate),
        checkoutDate: String(checkinDate),
        name: this.userName
      });
  
      // Очищаємо вибір після бронювання
      this.selectedRoom = null;
      this.selectedDates = [];
      this.userName = '';
    }
    else alert('На даному проміжку є зарезервовані дні!')

  }

  isSelectedRoom(room: number): boolean {
    return this.selectedRoom === room;
  }

  getFilteredRooms() {
    return this.rooms.filter(room => {
      let isAvailable = this.isRoomAvailableForSelectedDates(room.number); // перевірка доступності кімнати
      const isTypeMatch = this.filter.type ? room.type === this.filter.type : true;
      const isCapacityMatch = this.filter.capacity ? room.capacity === this.filter.capacity : true;
      const isPriceMatch = room.price >= this.filter.price.min && room.price <= this.filter.price.max;
      const isDateRangeMatch = this.filter.dateRange.start && this.filter.dateRange.end ?
        this.isRoomAvailableForDateRange(room.number, this.filter.dateRange.start!, this.filter.dateRange.end!) : true;
      
      return isAvailable && isTypeMatch && isCapacityMatch && isPriceMatch && isDateRangeMatch;
    });
  }

  isRoomAvailableForDateRange(room: number, start: string, end: string): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);
  
    return !this.bookings.some(booking =>
      booking.room === room &&
      !(startDate.getTime() >= new Date(booking.checkoutDate).getTime() || endDate.getTime() <= new Date(booking.checkinDate).getTime()) // перевірка на наявність перекриття
    );
  }
  
  isRoomAvailableForSelectedDates(room: number): boolean {
    if (this.filter.dateRange.start && this.filter.dateRange.end)
      return this.selectedDates.every(date => !this.isRoomReserved(room, date)); // перевірка на доступність кожної обраної дати
    else return true
  }

  fbGetData() {
    // Initialize the database
    const db = getDatabase(app);
  
    // Set a reference to a 'bookings' node (assuming your bookings are stored at '/bookings' in Firebase)
    const bookingsRef = ref(db, '/');
  
    // Listen for real-time updates
    onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        // Clear previous bookings
        this.bookings = [];
  
        // Iterate over each booking and push its data
        snapshot.forEach((childSnapshot) => {
          const bookingData = childSnapshot.val();  // The actual booking data
          this.bookings.push({
            room: bookingData.room,
            checkinDate: bookingData.checkinDate,
            checkoutDate: bookingData.checkoutDate,
            name: bookingData.name
          });
        });
      } else {
        console.log("No data available");
      }
    }, (error) => {
      console.error("Error fetching data from Firebase:", error);
    });
  }
  
  fbPostData() {
    // Ensure that necessary booking details are selected
    if (!this.selectedRoom || !this.selectedDates.length || !this.userName) {
      alert('Please select a room, dates, and enter your name!');
      return;
    }
  
    // Get the selected check-in and check-out dates
    const checkinDate = new Date(this.selectedDates[0]);
    const checkoutDate = new Date(this.selectedDates[this.selectedDates.length - 1]);
  
    // Format the dates to "YYYY-MM-DD" without any time zone issues
    const formattedCheckinDate = this.formatDate1(checkinDate);
    const formattedCheckoutDate = this.formatDate1(checkoutDate);
  
    // Create a new booking object
    const newBooking = {
      room: this.selectedRoom,
      checkinDate: formattedCheckinDate, // Use formatted date
      checkoutDate: formattedCheckoutDate, // Use formatted date
      name: this.userName
    };
  
    console.log(newBooking);
  
    // Initialize the database
    const db = getDatabase(app);
    // Set a reference to a 'bookings' node and push a new booking to it
    const bookingsRef = ref(db, '/');

    console.log(newBooking)
  
    // Add the new booking data
    push(bookingsRef, newBooking)
      .then(() => {
        // Update local data and reset fields on success
        this.bookings.push(newBooking);
        console.log(newBooking);
        this.selectedRoom = null;
        this.selectedDates = [];
        this.userName = '';
        alert('Room booked successfully!');
      })
      .catch((error) => {
        console.error("Error adding booking to Firebase:", error);
        alert("Failed to book room. Please try again.");
      });
  }  

  formatDate1(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-indexed
    const day = String(date.getDate() + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
