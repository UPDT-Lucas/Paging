import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaginationService } from '../pagination.service';
import { ActivatedRoute } from '@angular/router';
import { Page } from '../classes/Page';

@Component({
  selector: 'app-simulation',
  standalone: true,
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, OnDestroy {

  seed: string = "";
  algorithm: string = "";
  processes: string = "";
  operations: string = "";
  ready: boolean = false;

  allSimulationLogs: Map<number, Page[]> [] = [];  // Guardará todos los logs
  visibleLogs: Map<number, Page[]> [] = [];  // Se mostrarán los logs progresivamente
  optLogs: Page[] = [];  // Guardará todos los logs
  visibleOptLogs: Page[] = [];  // Se mostrarán los logs progresivamente
  currentLogIndex: number = 0; // Índice del log actual a mostrar

  loadedColors = Array(100).fill("white");
  loadedColorsOpt = Array(100).fill("white");

  getLoadedPages: Page[] = [];
  getAllLoadedPages: Page[] = [];

  items = Array(100).fill("white");
  time: number = 0;
  timer: any; // Para controlar el tiempo entre logs

  constructor(private service: PaginationService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.seed = params['seed'];
      this.algorithm = params['algorithm'];
      this.processes = params['processes'];
      this.operations = params['operations'];
      this.callAlgorithm();  // Iniciar la simulación
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer); // Detener el temporizador al salir del componente
  }

  // Método para iniciar el temporizador
  startSimulation() {
    this.timer = setInterval(() => {
        if (this.currentLogIndex < this.allSimulationLogs.length) {
          // Mostrar el siguiente log
          this.visibleLogs.push(this.allSimulationLogs[this.currentLogIndex]);
          this.visibleOptLogs.push(this.optLogs[this.currentLogIndex]);
          // this.getLoadedPages.push(this.getAllLoadedPages[this.currentLogIndex]);
          this.currentLogIndex++;
        } else {
          // Si se han mostrado todos los logs, detener el temporizador
          clearInterval(this.timer);
      }
    }, 500);
  }

  // Método que llama al algoritmo seleccionado
  callAlgorithm() {
    switch (this.algorithm) {
      case "MRU":
        //this.allSimulationLogs = [this.service.getMRU()];  // Guardar todos los logs de MRU
        break;
      case "FIFO":
        //this.allSimulationLogs = [this.service.getFIFO()];  // Guardar los logs de FIFO
        break;
      case "RND":
        this.allSimulationLogs = this.service.getRND();  // Guardar los logs de RND
        this.getAllLoadedPages = this.service.getLoadedRND();
        console.log(this.allSimulationLogs)
        break;
      default:
        //this.allSimulationLogs = ["Algorithm not recognized"];
        break;
    }
    this.startSimulation();  // Iniciar la simulación después de cargar los logs
  }

  getLoadedColor(index: number) {
    if(this.loadedColors[index] == "white") {
      const saturation = Math.floor(Math.random() * 50) + 50;
      const lightness = Math.floor(Math.random() * 30) + 10;
      this.loadedColors[index] = `hsl(${150}, ${saturation}%, ${lightness}%)`;
    }
    return this.loadedColors[index];
  }

  getLoadedColorOPT(index: number) {
    if(this.loadedColorsOpt[index] == "white") {
      const saturation = Math.floor(Math.random() * 50) + 50;
      const lightness = Math.floor(Math.random() * 30) + 10;
      this.loadedColorsOpt[index] = `hsl(${200}, ${saturation}%, ${lightness}%)`;
    }
    return this.loadedColorsOpt[index];
  }
}
