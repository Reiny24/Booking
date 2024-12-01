import { Component, OnInit } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';

interface Booking {
  id: number;
  room: number;
  checkinDate: string;
  checkoutDate: string;
}

interface Room {
  number: number;
  type: string; // тип кімнати (звичайна, преміум, бізнес)
  capacity: number; // кількість спальних місць
  price: number; // ціна
}

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

@Component({
  selector: 'app-room-reservations',
  standalone: true,
  imports: [NgFor, NgClass, FormsModule, NgIf], // Додано FormsModule
  templateUrl: './room-reservations.component.html',
  styleUrls: ['./room-reservations.component.css'],
  providers: [DataService],
})

export class RoomReservationsComponent implements OnInit {
  hotelId!: string;
  rooms: Room[] = [];
  days: string[] = [];
  currentDayCount: number = 30;
  bookings: Booking[] = [];
  selectedDates: string[] = [];
  selectedRoom: number | null = null;
  roomTypes: string[] = [];
  filter: {
    type: string | null;
    capacity: number | null;
    price: number;
    dateRange: { start: string | null; end: string | null };
  } = {
    type: null,
    capacity: null,
    price: 10000000,
    dateRange: { start: null, end: null },
  };

  userName: string = '';
  userLastName: string = '';
  userPhone: string = '';
  userEmail: string = '';
  companyName: string = '';
  companyEmail: string = '';
  companyPhone: string = '';

  deleteBtn: boolean = false;
  idDelete: string = '-1';

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {}

  ngOnInit() {
    this.hotelId = this.route.snapshot.paramMap.get('id')!;
    this.addDays(); // Initialize days or other logic

    // Fetch hotel data and filter based on roomBuilding
    this.dataService.fetch('http://localhost:8080/home').subscribe((data) => {
      // Replace 'A' with the desired roomBuilding value dynamically
      const building = data.find((b: any) => b.roomBuilding === this.hotelId);
      
      if (building) {
        // Fetch room details for the specific building
        this.dataService.fetch('http://localhost:8080/rooms?buildingId=' + building.roomBuilding).subscribe((data1) => {
          // Map the fetched data to the rooms
          this.rooms = building.roomNumbers.map((roomNumber: number) => {
            // Find the corresponding room data from the second fetch (data1)
            const roomDetails = data1.find((room: any) => room.roomId.roomNumber === roomNumber);
    
            // Return a new room object with combined data
            return {
              number: roomNumber,
              type: roomDetails ? roomDetails.roomType.roomType : 'Standard', // Default to 'Standard' if not found
              capacity: roomDetails ? roomDetails.capacity : 2, // Default capacity
              price: roomDetails ? roomDetails.price : 100, // Default price
              roomBuilding: roomDetails ? roomDetails.roomId.roomBuilding : 'A', // Default building
            };
          });
        // Extract unique room types from the fetched room details
        const uniqueRoomTypes = [...new Set(this.rooms.map(room => room.type))];

        // Dynamically populate the select options
        this.roomTypes = uniqueRoomTypes;
        });
      }
    });
    

    this.dataService.fetch('http://localhost:8080/booking?buildingId=' + this.hotelId).subscribe((data: any[]) => {
      this.bookings = data.map(item => ({
        id: item.bookingId,
        room: item.roomId.roomNumber,
        checkinDate: item.checkinDate,
        checkoutDate: this.formatDate(new Date(item.checkoutDate), -1)
      }));
    });
  }

  addDays() {
    const startDate = new Date();
    const start = this.days.length;
    const end = start + this.currentDayCount;

    for (let i = start; i < end; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.days.push(this.formatDate(date, 0));
    }
  }

  formatDate(date: Date, daysToAdd: number): string {
    const day = String(date.getDate() + daysToAdd).padStart(2, '0');
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

  isRoomReserved(roomNumber: number, day: string): string | null {
    const booking = this.bookings.find(
      (b) => b.room === roomNumber && day >= b.checkinDate && day <= b.checkoutDate
    );
    return booking ? booking.id.toString() : null;
  }

  onSelectDate(id: string | null, date: string, room: number) {
    if (
      this.isRoomReserved(room, date) ||
      (this.selectedRoom && this.selectedRoom != room)
    ) {
      
      if (id) {
        this.idDelete = id;  
        this.loadBookingData(id); 
        this.deleteBtn = true;     
      }

      return; // Не дозволяємо вибір зарезервованих клітинок
    }

    this.deleteBtn = false; 
    this.idDelete = '-1'
    
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
      this.selectedRoom = null;
    }
  }

  bookRoom() {
    if (!this.selectedRoom || !this.selectedDates.length || !this.userName) {
      alert("Будь ласка, виберіть кімнату, дати та введіть своє ім'я!");
      return;
    }
  
    const checkinDate = new Date(this.selectedDates[0]);
    const checkoutDate = new Date(this.selectedDates[this.selectedDates.length - 1]);
  
    if (
      this.isRoomAvailableForDateRange(
        this.selectedRoom,
        String(checkinDate),
        String(checkoutDate),
        '-1'
      )
    ) {
      // Construct the guest and company objects
      const guest: Guest = {
        firstName: this.userName,
        lastName: this.userLastName,
        email: this.userEmail,
        phoneNumber: this.userPhone,
      };
  
      const company: Company = {
        companyName: this.companyName,
        companyEmail: this.companyEmail,
        companyPhoneNumber: this.companyPhone,
      };
      
      let dayToAdd = 0;
      if (this.formatDate(checkinDate, 0) === this.formatDate(checkoutDate, 0)) dayToAdd = 1;

      this.dataService.postBooking(
        this.selectedRoom,
        this.hotelId,
        this.formatDate(checkinDate, 0),
        this.formatDate(checkoutDate, dayToAdd),
        guest,
        company
      ).subscribe(
        (response) => {
          const bookingId = response.bookingId;
          window.location.reload();
        },
        (error) => {
          console.error('Booking failed:', error);
          alert("Не коректно введені дані")
        }
      );
    } else {
      alert('На даному проміжку є зарезервовані дні!');
    }
  }
  
  isSelectedRoom(room: number): boolean {
    return this.selectedRoom === room;
  }

  getFilteredRooms() {
    return this.rooms.filter((room) => {
      let isAvailable = this.isRoomAvailableForSelectedDates(room.number); // перевірка доступності кімнати
      const isTypeMatch = this.filter.type
        ? room.type === this.filter.type
        : true;
      const isCapacityMatch = this.filter.capacity
        ? room.capacity === this.filter.capacity
        : true;
      const isPriceMatch = room.price <= this.filter.price;
      const isDateRangeMatch =
        this.filter.dateRange.start && this.filter.dateRange.end
          ? this.isRoomAvailableForDateRange(
              room.number,
              this.filter.dateRange.start!,
              this.filter.dateRange.end!,
              '-1'
            )
          : true;

      return (
        isAvailable &&
        isTypeMatch &&
        isCapacityMatch &&
        isPriceMatch &&
        isDateRangeMatch
      );
    });
  }

  isRoomAvailableForDateRange(
    room: number,
    start: string,
    end: string,
    bookingId: string
  ): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);
  
    return !this.bookings.some((booking) => {
      // Check if the booking is for the same room and has a different booking ID
      let isDifferentBooking = true
      if (bookingId !== '-1') isDifferentBooking = booking.id !== Number(bookingId);
      const isSameRoom = booking.room === room;
  
      // Check if there is a date overlap
      const isOverlap =
        startDate.getTime() < new Date(booking.checkoutDate).getTime() &&
        endDate.getTime() > new Date(booking.checkinDate).getTime();
  
      // If the booking is for the same room, different booking ID, and overlaps, return true (i.e., room is unavailable)
      return isSameRoom && isDifferentBooking && isOverlap;
    });
  }

  isRoomAvailableForSelectedDates(room: number): boolean {
    if (this.filter.dateRange.start && this.filter.dateRange.end)
      return this.selectedDates.every(
        (date) => !this.isRoomReserved(room, date)
      );
    else return true;
  }

  applyFilters(
    roomType: HTMLSelectElement,
    roomCapacity: HTMLInputElement,
    priceMax: HTMLInputElement,
  ) {
    if (roomType.value === '' && roomCapacity.value === '' && priceMax.value === '') window.location.reload();
    const filterValues = {
      type: roomType.value,
      capacity: roomCapacity.value,
      price: priceMax.value,
    };

    // Filter rooms based on the selected values
    this.rooms = this.rooms.filter(room => {
      const matchesType = filterValues.type ? room.type === filterValues.type : true;
      const matchesCapacity = filterValues.capacity ? room.capacity >= Number(filterValues.capacity) : true;
      const matchesPrice = filterValues.price ? room.price <= Number(filterValues.price) : true;

      return matchesType && matchesCapacity && matchesPrice;
    });
  }
  
  deleteBooking() {
    this.dataService.delete(this.idDelete).subscribe({
      next: () => {
        // Optionally, reload data here or update your reservations without reloading the page
        window.location.reload();
      },
      error: (err) => console.error('Delete failed', err),
    });;
  }

  bookingCheckinDate: string = '';
  bookingCheckoutDate: string = '';
  bookingId: string = '-1';
  bookingRoom: string = '-1';
  guestBooking: Guest = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  }
  companyBooking: Company = {
    companyName: '',
    companyEmail: '',
    companyPhoneNumber: ''
  }

  loadBookingData(id: string | null) {
    if (id) {
      this.dataService.fetch(`http://localhost:8080/booking/${id}`).subscribe((data: any) => {
        this.bookingId = id;
        this.bookingRoom = data.roomId.roomNumber;
        this.bookingCheckinDate = data.checkinDate;
        this.bookingCheckoutDate = data.checkoutDate;
        
        this.guestBooking = {
          firstName: data.guest.firstName,
          lastName: data.guest.lastName,
          email: data.guest.email,
          phoneNumber: data.guest.phoneNumber,
        };

        const company: Company = {
          companyName: data.guest.companyName,
          companyEmail: data.guest.companyEmail,
          companyPhoneNumber: data.guest.companyPhoneNumber,
        };
      });
    }
  }
  
  updateBooking() {
    if (this.bookingId && this.bookingCheckinDate && this.bookingCheckoutDate) {
      const room = Number(this.bookingRoom);
      const canUpdate = this.isRoomAvailableForDateRange(room, this.bookingCheckinDate, this.bookingCheckoutDate, this.bookingId);
  
      if (canUpdate) {
        this.dataService.put(this.bookingId, Number(this.bookingRoom), this.hotelId, this.bookingCheckinDate, this.bookingCheckoutDate, this.guestBooking, this.companyBooking).subscribe(
          () => {
            alert('Booking updated successfully!');
            window.location.reload();
          },
          (error) => {
            alert('Failed to update booking. Please try again.');
            console.error(error);
          }
        );
      } else {
        alert("В данному проміжку є зарезервовані дні!");
      }
    }
  }
  
}
