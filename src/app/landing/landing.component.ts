import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PaginationService } from '../pagination.service';


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
  selectedFile: File | null = null;

  constructor(private router: Router, private paginationService: PaginationService) {}

  getData(){
    this.paginationService.setFile(this.selectedFile);

    this.router.navigate([
      '/simulation',
      this.entry,
      this.selectedAlgorithm,
      this.selectedProcesses,
      this.selectedOperations]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Guardar el archivo seleccionado
      console.log(this.selectedFile); // Puedes inspeccionar el archivo aquí
    }
  }
}
