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

  createProcess(): void {
    const newProcess: Process = new Process(this.pageConsecutive++);
    this.processes.push(newProcess);
    this.fifoQueue.push(newProcess);
  }

  createPointer(): Pointer {
    this.pointerConsecutive++;
    const newPointer: Pointer = new Pointer(this.pointerConsecutive, 'test');
    if (!this.pointerPageMap.has(newPointer.id)) {
      this.pointerPageMap.set(newPointer.id, []);
    }
    return newPointer;
  }

  cNewProcess(): void {}

  cKillProcess(): void {}

  cDeleteProcess(): void {}
}
