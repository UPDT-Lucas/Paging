import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaginationService } from '../pagination.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, OnDestroy {

  items = Array(100).fill("white");
  time: number = 0;
  timer: any;

  constructor(private service: PaginationService) {
    this.items[0] = "red";
    this.items[1] = "blue";
    this.items[2] = "yellow";
  }

  ngOnInit(): void {
    this.service.getMRU();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.time += 1;
    }, 1000);
  }
}
