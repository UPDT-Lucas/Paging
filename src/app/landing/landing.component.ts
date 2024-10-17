import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  entry: string = "123"
  selectedAlgorithm: string = "FIFO"
  selectedProcesses: string = "Default"
  selectedOperations: string = "Default"

  constructor(private router: Router) {} // Inyectar el router

  getData(){
    console.log(this.entry)
    console.log(this.selectedAlgorithm)
    console.log(this.selectedProcesses)
    console.log(this.selectedOperations)
    this.router.navigate([
      '/simulation',
      this.entry,
      this.selectedAlgorithm,
      this.selectedProcesses,
      this.selectedOperations]);
  }
}
