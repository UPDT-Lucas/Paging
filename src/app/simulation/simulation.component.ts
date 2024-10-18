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

  currentColor: string = "white";

  seed: string = "";
  algorithm: string = "";
  processes: string = "";
  operations: string = "";
  selectedFile: File | null = null;
  ready: boolean = false;

  allSimulationLogs: Page [][]= [];  // Guardará todos los logs
  visibleLogs: Page [][]= [];  // Se mostrarán los logs progresivamente
  optLogs: Page[] = [];  // Guardará todos los logs
  visibleOptLogs: Page[] = [];  // Se mostrarán los logs progresivamente
  currentLogIndex: number = 0; // Índice del log actual a mostrar

  loadedColors: string[] = [];
  loadedColorsOpt: string[] = [];

  getLoadedPages: Page[] = [];
  getAllLoadedPages: Page[] = [];

  items = Array(100).fill("white");
  time: number = 0;
  timer: any; // Para controlar el tiempo entre logs

  statsAlgColor: string = ""
  statsOptColor: string = ""

  trashing: number[] = []
  actualTrashing: number = 0;
  memUsg: number[] = []
  actualMemUsg: number = 0;
  clock: number[] = []
  actualClock: number = 0;
  actualVirtualMemUsg: number = 0;
  virtualMemUsg: number[] = [];
  fileContent: string | ArrayBuffer | null | undefined;

  constructor(private service: PaginationService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.seed = params['seed'];
      this.algorithm = params['algorithm'];
      this.processes = params['processes'];
      this.operations = params['operations'];

      this.selectedFile = this.service.getFile();
      console.log(this.selectedFile);
      if (this.selectedFile) {
        console.log(this.selectedFile);
      }
      this.callAlgorithm();  // Iniciar la simulación
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer); // Detener el temporizador al salir del componente
  }

  getTrashingPercentage(): number {
    return Math.round((this.actualTrashing / this.actualClock) * 100);
  }

  getVRamPercentage(): number {
    return Math.round((this.actualVirtualMemUsg / 40) * 100);
  }

  getRamPercentage(): number {
    return Math.round((this.actualVirtualMemUsg / 400) * 100);
  }

  // readFile(file: File) {
  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     this.fileContent = event.target?.result;  // Guardamos el contenido leído
  //     this.processFileContent();  // Procesar el contenido del archivo
  //   };
  //   reader.onerror = (event) => {
  //     console.error("Error al leer el archivo: ", event);
  //   };
  //   reader.readAsText(file);
  // }

  // processFileContent() {
  //   if (typeof this.fileContent === 'string') {
  //     const fileLines = this.fileContent.split('\n');
  //     fileLines.forEach((line, index) => {
  //       console.log(`Línea ${index + 1}: ${line}`);
  //     });
  //   }
  // }


  // Método para iniciar el temporizador
  startSimulation() {
    this.timer = setInterval(() => {
      if (this.currentLogIndex < this.allSimulationLogs.length) {
        this.visibleLogs.push(this.allSimulationLogs[this.currentLogIndex]);
        this.getLoadedPages.push(this.getAllLoadedPages[this.currentLogIndex]);
        this.actualTrashing = this.trashing[this.currentLogIndex];
        this.actualMemUsg = this.memUsg[this.currentLogIndex];
        this.actualClock = this.clock[this.currentLogIndex];
        this.actualVirtualMemUsg = this.virtualMemUsg[this.currentLogIndex];
        this.currentLogIndex++;
      } else {
        clearInterval(this.timer);
      }
    }, 100);
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
        this.service.processLines(this.selectedFile!, 4);
        this.allSimulationLogs = this.service.getRND();  // Guardar los logs de RND
        this.getAllLoadedPages = this.service.getLoadedRND();
        this.trashing = this.service.getTrashing();
        this.memUsg = this.service.getMemUsg();
        this.clock = this.service.getClock();
        this.virtualMemUsg =  this.service.getVirtualMemUsg();
        break;
      default:
        //this.allSimulationLogs = ["Algorithm not recognized"];
        break;
    }
    this.precomputeColors();
    this.startSimulation();  // Iniciar la simulación después de cargar los logs
  }

  getLoadedColor(i: number): string {
    return this.loadedColors[i];
  }

  precomputeColors() {
    this.allSimulationLogs.forEach(log => {
      const logColors: string = this.generateRandomColor();
      this.loadedColors.push(logColors);
    });
    this.statsAlgColor = this.generateRandomColor();
    this.statsOptColor = this.generateRandomColorOpt();
  }

  generateRandomColor(): string {
    const saturation = Math.floor(Math.random() * 50) + 50;
    const lightness = Math.floor(Math.random() * 30) + 10;
    return `hsl(${200}, ${saturation}%, ${lightness}%)`;
  }

  generateRandomColorOpt(): string {
    const saturation = Math.floor(Math.random() * 50) + 50;
    const lightness = Math.floor(Math.random() * 30) + 10;
    return `hsl(${100}, ${saturation}%, ${lightness}%)`;
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
