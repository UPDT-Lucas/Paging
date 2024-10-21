import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaginationService } from '../pagination.service';
import { ActivatedRoute } from '@angular/router';
import { Page } from '../classes/Page';
import { Pointer } from '../classes/Pointer';
import { Fifo } from '../classes/Fifo';
import { SecondChance } from '../classes/SecondChance';
import { MRU } from '../classes/MRU';
import { RND } from '../classes/RND';
import { cloneDeep } from 'lodash';

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

  actualProcessId: number = 0;

  allSimulationLogs: ProcesoTupla[][] = [];  // Guardará todos los logs
  processIds: number[] = [];  // Guardará los ids de los procesos
  pointers: number[] = [];
  visibleLogs: Page[][] = [];  // Se mostrarán los logs progresivamente
  optLogs: Page[] = [];  // Guardará todos los logs
  visibleOptLogs: Page[] = [];  // Se mostrarán los logs progresivamente
  currentLogIndex: number = 0; // Índice del log actual a mostrar

  loadedColors: string[] = [];
  loadedColorsOpt: string[] = [];

  loadedPages: Page [] = [];
  allLoadedPages: Page[][] = [];

  actualPtr: number = 0;

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
  ramColors: string[] = [];

  usesStack: number[] = [];
  instructionsMap: ValueTuple[] = [];
  indexToColors: number[] = [];
  actualPagingAlg: Fifo | SecondChance | MRU | RND | undefined;
  actualFragmentation: number = 0;

  constructor(private service: PaginationService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.seed = params['seed'];
      this.algorithm = params['algorithm'];
      this.processes = params['processes'];
      this.operations = params['operations'];

      this.selectedFile = this.service.getFile();
      if (this.selectedFile instanceof File) {
        this.readFile(this.selectedFile);
      } else {
        console.error('selectedFile is not a valid File object:', this.selectedFile);
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer); // Detener el temporizador al salir del componente
  }

  getTrashingPercentage(): number {
    return Math.round((this.actualTrashing / this.actualClock) * 100);
  }

  getVRamPercentage(): number {
    return Math.round((this.actualVirtualMemUsg / 400) * 100);
  }

  getRamPercentage(): number {
    return Math.round((this.actualMemUsg / 400) * 100);
  }

  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      this.fileContent = event.target?.result;
      this.processFileContent();
    };
    reader.onerror = (event) => {
      console.error("Error al leer el archivo: ", event);
    };
    reader.readAsText(file);
  }

  processFileContent() {
    this.actualPagingAlg = this.getPagingAlg(this.algorithm, this.seed);

    if (typeof this.fileContent === 'string') {
      const fileLines = this.fileContent.split('\n');
      const usePattern = /use\((\d+)\)/;
      const newPattern = /new\((\d+),(\d+)\)/;
      const deletePattern = /delete\((\d+)\)/;
      const killPattern = /kill\((\d+)\)/;

      fileLines.forEach((line, index) => {
        if (line.length === 0) {
          return; // Ignorar líneas vacías
        }

        if (usePattern.test(line)) {
          const match = line.match(usePattern);
          const numberInsideParentheses = match![1];

          this.instructionsMap.push([1, [numberInsideParentheses]]);
          this.usesStack.push(Number(numberInsideParentheses));
        } else if (newPattern.test(line)) {
          const match = line.match(newPattern);
          const firstNumber = match![1];
          const secondNumber = match![2];
          this.instructionsMap.push([2, [firstNumber, secondNumber]]);
        } else if (deletePattern.test(line)) {
          const match = line.match(deletePattern);
          const numberInsideParentheses = match![1];
          this.instructionsMap.push([3, [numberInsideParentheses]]);
        } else if (killPattern.test(line)) {
          const match = line.match(killPattern);
          const numberInsideParentheses = match![1];
          this.instructionsMap.push([4, [numberInsideParentheses]]);
        } else {
          console.log(`Línea ${index + 1}: No se reconoce la instrucción.`);
        }
      });

    }
    this.instructionsMap.forEach(([id, value]) => {

      // resultado = this.generateData(id,value,paginAlgorithm)
      // const deepCopiedResult = cloneDeep(resultado);
      // logs.push(deepCopiedResult!);

      if(this.actualPagingAlg!==undefined){
        if(id===1){
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cUsePointer(Number(value[0]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
        }else if(id===2){
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cNewProcess(Number(value[0]),Number(value[1]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
        }else if(id===3){
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cDeleteProcess(Number(value[0]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
        }else if(id===4){
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cKillProcess(Number(value[0]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
        }
      }
    });
    this.precomputeColors();
  }

  startSimulation() {
    this.timer = setInterval(() => {
      this.visibleLogs = [];
      this.processIds = [];
      this.loadedPages = [];
      this.pointers = [];
      this.indexToColors = [];
      this.actualFragmentation = 0;
      let pageInRam = 0;
      if (this.currentLogIndex < this.allSimulationLogs.length) {
        this.loadedPages = this.allLoadedPages[this.currentLogIndex];
        const eachLog = this.allSimulationLogs[this.currentLogIndex];
        eachLog.forEach((page) => {
          this.processIds.push(page[0]);
          this.actualProcessId = page[0];
          this.indexToColors.push(page[0]);
          this.pointers.push(page[1].id);
          this.actualPtr = page[1].id;
          this.visibleLogs.push(page[2]);
          page[2].forEach((p: Page, index) => {
            if(p.isOnRam()){
              this.ramColors[pageInRam] = this.getLoadedColor(page[0]);
              pageInRam++;
            }
          })
          if(this.actualPagingAlg instanceof RND || this.actualPagingAlg instanceof MRU){
            this.actualFragmentation += page[1].getFragmentation() / 1024;
          }else{
            this.actualFragmentation += page[1].getFragmentation();
          }
        })
        this.actualTrashing = this.trashing[this.currentLogIndex];
        this.actualMemUsg = this.memUsg[this.currentLogIndex];
        this.actualClock = this.clock[this.currentLogIndex];
        this.actualVirtualMemUsg = this.virtualMemUsg[this.currentLogIndex];
        this.currentLogIndex++;
      } else {
        clearInterval(this.timer);
      }
    }, 3000);
  }

  getLoadedColor(i: number): string {
    return this.loadedColors[i];
  }

  precomputeColors() {
    for(let i=0;i<100;i++){
      const logColors: string = this.generateRandomColor();
      this.loadedColors.push(logColors);
    }
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
    if (this.loadedColorsOpt[index] == "white") {
      const saturation = Math.floor(Math.random() * 50) + 50;
      const lightness = Math.floor(Math.random() * 30) + 10;
      this.loadedColorsOpt[index] = `hsl(${200}, ${saturation}%, ${lightness}%)`;
    }
    return this.loadedColorsOpt[index];
  }

  getPagingAlg(name: string, seed: string): Fifo | SecondChance | MRU | RND | undefined{
    if (name == "FIFO") {
      return new Fifo();
    } else if (name == "SC") {
      return new SecondChance();
    } else if (name == "MRU") {
      return new MRU();
    } else if (name == "RND") {
      return new RND(seed);
    }
    return undefined;
  }
}
