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
import Rand from 'rand-seed';
import { OPT } from '../classes/OPT';

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
  currentLogIndex: number = 0; // Índice del log actual a mostrar

  optLogs: ProcesoTupla[][]=[];

  loadedColors: string[] = [];
  loadedColorsOpt: string[] = [];

  loadedPages: Page[] = [];
  allLoadedPages: Page[][] = [];

  allOptLoadedPages: Page[][] = [];
  visibleOptLogs: Page[][] = [];

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
  ramOptColors: string[] = [];

  actualOptMemUsg: number = 0;
  actualOptTrashing: number = 0;
  actualOptClock: number = 0;
  actualOptVirtualMemUsg: number = 0;

  usesStack: number[] = [];
  instructionsMap: ValueTuple[] = [];
  indexToColors: number[] = [];
  actualPagingAlg: Fifo | SecondChance | MRU | RND | undefined;
  actualFragmentation: number = 0;
  actualOptFragmentation: number = 0;

  optClock: number[] = []
  optMemUsg: number[] = []
  optTrashing: number[] = []
  optVirtualMemUsg: number[] = []

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
        this.generateInstructions();
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

  getOptTrashingPercentage(): number {
    return Math.round((this.actualOptTrashing / this.actualOptClock) * 100);
  }

  getOptVRamPercentage(): number {
    return Math.round((this.actualOptVirtualMemUsg / 400) * 100);
  }

  getOptRamPercentage(): number {
    return Math.round((this.actualOptMemUsg / 400) * 100);
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
    this.getResults();
    this.precomputeColors();
  }

  getResults() {
    let optAlgorithm:OPT = new OPT(this.usesStack);

    this.instructionsMap.forEach(([id, value]) => {
      if (this.actualPagingAlg !== undefined) {
        if (id === 1) {
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cUsePointer(Number(value[0]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
          this.optLogs.push(cloneDeep(optAlgorithm.cUsePointer(Number(value[0]))!));
        } else if (id === 2) {
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cNewProcess(Number(value[0]), Number(value[1]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
          this.optLogs.push(cloneDeep(optAlgorithm.cNewProcess(Number(value[0]), Number(value[1]))!));
        } else if (id === 3) {
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cDeleteProcess(Number(value[0]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
          this.optLogs.push(cloneDeep(optAlgorithm.cDeleteProcess(Number(value[0]))!));
        } else if (id === 4) {
          this.allSimulationLogs.push(cloneDeep(this.actualPagingAlg.cKillProcess(Number(value[0]))!));
          this.allLoadedPages.push(cloneDeep(this.actualPagingAlg.getLoadedPages()));
          this.memUsg.push(cloneDeep(this.actualPagingAlg.getCurrentMemUsage()));
          this.clock.push(cloneDeep(this.actualPagingAlg.getClock()));
          this.trashing.push(cloneDeep(this.actualPagingAlg.getTrashing()));
          this.virtualMemUsg.push(cloneDeep(this.actualPagingAlg.getCurrentVirtualMemUsage()));
          this.optLogs.push(cloneDeep(optAlgorithm.cKillProcess(Number(value[0]))!));
        }
      }
      this.allOptLoadedPages.push(cloneDeep(optAlgorithm.getLoadedPages()));
      this.optClock.push(cloneDeep(optAlgorithm.getClock()));
      this.optMemUsg.push(cloneDeep(optAlgorithm.getCurrentMemUsage()));
      this.optTrashing.push(cloneDeep(optAlgorithm.getTrashing()));
      this.optVirtualMemUsg.push(cloneDeep(optAlgorithm.getCurrentVirtualMemUsage()));
    });
    console.log(this.actualPagingAlg!.getTrashing())
    console.log(optAlgorithm.getTrashing())
  }

  public generateInstructions(): void {
    this.actualPagingAlg = this.getPagingAlg(this.algorithm, this.seed);
    const generator = new Rand(this.seed);
    let instructionsCounter = 0;
    let pointerList: number[] = [];
    let processesCreated: number[] = [];
    let processList: Map<number, number[]> = new Map<number, number[]>();
    let pointerCounter = 1;

    for (let i = 0; i < parseInt(this.processes); i++) {
      processList.set(i, []);
    }

    for (let i = 0; i < 34; i++) {
      let pID = Math.floor(generator.next() * processList.size);
      let keyToCreate = this.getKeyByIndex(processList, pID);
      if (keyToCreate !== undefined) {
          let value = Math.floor(generator.next() * 12288);
          this.instructionsMap.push([2, [keyToCreate+"", value+""]]);
          this.addValueToMap(processList, keyToCreate, pointerCounter);
          pointerList.push(pointerCounter);
          processesCreated.push(keyToCreate);
          pointerCounter++;
      }
  }

    while (instructionsCounter < parseInt(this.operations)) {
      let instructionNumber = Math.floor(generator.next() * 100);
      let pID: number;
      let value: number;

      if (instructionNumber < 1 && processesCreated.length !== 0) { // 5% de probabilidad
        let keyToDelete: number | undefined;

        // Generar un ID aleatorio y validar que tenga elementos en su lista
        do {
          pID = Math.floor(generator.next() * processList.size);
          keyToDelete = this.getKeyByIndex(processList, pID);
        } while (keyToDelete === undefined || (processList.get(keyToDelete)?.length === 0));

        // Una vez que tenemos un keyToDelete válido
        if (keyToDelete !== undefined) {
          this.instructionsMap.push([4, [keyToDelete + ""]]);

          for (const point of processList.get(keyToDelete) || []) {
            pointerList = pointerList.filter(num => num !== point);
          }
          processesCreated = processesCreated.filter(num => num !== keyToDelete);
          processList.delete(keyToDelete);
        }

      } else if (instructionNumber < 2 && pointerList.length !== 0) { // 10% de probabilidad
        pID = Math.floor(generator.next() * pointerList.length);
        this.instructionsMap.push([3, [pointerList[pID] + ""]]);
        this.removeValueFromMap(processList, pointerList[pID]);
        pointerList = pointerList.filter(num => num !== pointerList[pID]);

      } else if (instructionNumber < 80 && pointerList.length !== 0) { // 35% de probabilidad
        pID = Math.floor(generator.next() * pointerList.length);
        this.instructionsMap.push([1, [pointerList[pID] + ""]]);
        // Reemplaza esto por la lógica apropiada para pointerFuture si es necesario
        this.usesStack.push(pointerList[pID]);

      } else { // 50% de probabilidad
        pID = Math.floor(generator.next() * processList.size);
        let keyToCreate = this.getKeyByIndex(processList, pID);
        if (keyToCreate !== undefined) {
          value = Math.floor(generator.next() * 12288);
          this.instructionsMap.push([2, [keyToCreate + "", value + ""]]);
          this.addValueToMap(processList, keyToCreate, pointerCounter);
          pointerList.push(pointerCounter);
          // Reemplaza esto por la lógica apropiada para pointerFuture si es necesario

          processesCreated.push(keyToCreate);
          pointerCounter++;
        }
      }
      instructionsCounter++;
    }
    this.getResults();
    this.precomputeColors();
  }

  public getKeyByIndex(map: Map<number, number[]>, index: number): number | undefined {
    const keysArray = Array.from(map.keys());
    return index >= 0 && index < keysArray.length ? keysArray[index] : undefined;
  }

  public addValueToMap(map: Map<number, number[]>, key: number, value: number): void {
    if (map.has(key)) {
      map.get(key)?.push(value);
    } else {
      map.set(key, [value]);
    }
  }

  public removeValueFromMap(map: Map<number, number[]>, targetValue: number): void {
    for (const [key, valuesArray] of map.entries()) {
      const index = valuesArray.indexOf(targetValue);
      if (index !== -1) {
        valuesArray.splice(index, 1);
        map.set(key, valuesArray);
        break;
      }
    }
  }


  startSimulation() {
    this.timer = setInterval(() => {
      this.visibleLogs = [];
      this.visibleOptLogs = [];
      this.processIds = [];
      this.loadedPages = [];
      this.pointers = [];
      this.indexToColors = [];
      this.actualFragmentation = 0;
      this.actualOptFragmentation = 0;
      let pageInRam = 0;
      if (this.currentLogIndex < this.allSimulationLogs.length) {
        this.loadedPages = this.allLoadedPages[this.currentLogIndex];
        const eachLog = this.allSimulationLogs[this.currentLogIndex];
        eachLog.forEach((page, index) => {
          this.processIds.push(page[0]);
          this.actualProcessId = page[0];
          this.indexToColors.push(page[0]);
          this.pointers.push(page[1].id);
          this.actualPtr = page[1].id;
          this.visibleLogs.push(page[2]);
          this.visibleOptLogs.push(this.optLogs[this.currentLogIndex][index][2]);
          page[2].forEach((p: Page, index) => {
            if (p.isOnRam()) {
              this.ramColors[pageInRam] = this.getLoadedColor(page[0]);
              this.ramOptColors[pageInRam] = this.getLoadedColorOPT(page[0]);
              pageInRam++;
            }
          })
          if (this.actualPagingAlg instanceof RND || this.actualPagingAlg instanceof MRU) {
            this.actualFragmentation += page[1].getFragmentation() / 1024;
          } else {
            this.actualFragmentation += page[1].getFragmentation();
          }
          this.actualOptFragmentation += this.optLogs[this.currentLogIndex][index][1].getFragmentation();
        })
        this.actualTrashing = this.trashing[this.currentLogIndex];
        this.actualMemUsg = this.memUsg[this.currentLogIndex];
        this.actualClock = this.clock[this.currentLogIndex];
        this.actualVirtualMemUsg = this.virtualMemUsg[this.currentLogIndex];

        //optimo ->
        this.actualOptClock = this.optClock[this.currentLogIndex];
        this.actualOptMemUsg = this.optMemUsg[this.currentLogIndex];
        this.actualOptTrashing = this.optTrashing[this.currentLogIndex];
        this.actualOptVirtualMemUsg = this.optVirtualMemUsg[this.currentLogIndex];

        this.currentLogIndex++;
      } else {
        clearInterval(this.timer);
      }
    }, 100);
  }

  getLoadedColor(i: number): string {
    return this.loadedColors[i];
  }

  precomputeColors() {
    for (let i = 0; i < 100; i++) {
      const logColors: string = this.generateRandomColor();
      const logColorsOpt: string = this.generateRandomColorOpt();
      this.loadedColors.push(logColors);
      this.loadedColorsOpt.push(logColorsOpt);
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

  getLoadedColorOPT(i: number) {
    return this.loadedColorsOpt[i];
  }

  getPagingAlg(name: string, seed: string): Fifo | SecondChance | MRU | RND | undefined {
    if (name == "FIFO") {
      return new Fifo();
    } else if (name == "SC") {
      console.log("Entra xd")
      return new SecondChance();
    } else if (name == "MRU") {
      return new MRU();
    } else if (name == "RND") {
      return new RND(seed);
    }
    return undefined;
  }
}
