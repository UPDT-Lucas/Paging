import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';

export class Fifo implements IMMU {
  RAM: number;
  pageSize: number;
  currentMemUsage: number;
  clock: number;
  pageConsecutive: number;
  pointerConsecutive: number;
  pointerPageMap: Map<number, Page[]>;
  processes: Process[];
  fifoQueue: Process[];
  frameNum: number;
  availableAddresses: number[];

  constructor() {
    this.RAM = 400;
    this.pageSize = 4;
    this.frameNum = this.RAM / this.pageSize;
    this.availableAddresses = Array.from(
      { length: this.frameNum },
      (_, i) => i * this.pageSize,
    );
    this.currentMemUsage = 0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.processes = [];
    this.fifoQueue = [];
    this.pointerPageMap = new Map<number, Page[]>();
  }

  getProcessByID(id: number): Process {
    const p = this.processes.find((process) => process.id === id);
    if (p) {
      return p;
    } else {
      throw new Error('Process not found');
    }
  }

  getProcessByPointerId(id: number): Process {
    const p = this.processes.find((process) => process.isPointerInProcess(id));
    if (p) {
      return p;
    } else {
      throw new Error('Process not found');
    }
  }

  createProcess(pid: number): Process {
    const newProcess: Process = new Process(pid);
    this.processes.push(newProcess);
    return newProcess;
  }

  createPointer(): Pointer {
    this.pointerConsecutive++;
    const newPointer: Pointer = new Pointer(this.pointerConsecutive, 'test');
    if (!this.pointerPageMap.has(newPointer.id)) {
      this.pointerPageMap.set(newPointer.id, []);
    }
    return newPointer;
  }

  cNewProcess(pid: number, size: number): void {
    //bytesSize = size / 1000;
    //const exactPages = Math.ceil(kb / this.pageSize);
    var process: Process;
    if (this.isExistingProces(pid)) {
      process = this.getProcessByID(pid);
    } else {
      process = this.createProcess(pid);
    }
    const newPointer = this.createPointer();
    process.addPointer(newPointer);
  }

  cKillProcess(): void {}

  cDeleteProcess(): void {}

  isExistingProces(pid: number): boolean {
    return this.processes.some((process) => process.id === pid);
  }

  printProcesses(): void {
    this.processes.forEach((process) => {
      console.log(`Process ID: ${process.id}`);
      process.printPointers();
    });
  }
}
