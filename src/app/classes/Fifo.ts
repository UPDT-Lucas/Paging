import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';

export class Fifo implements IMMU {
  RAM: number;
  pageSize: number;
  currentMemUsage: number;
  currenVirtualMemUsage:number;
  clock: number;
  trashing:number;
  pageConsecutive: number;
  pointerConsecutive: number;
  pointerPageMap: Map<Pointer, Page[]>;
  processes: Process[];
  fifoQueue: Process[];
  fifoStaticPages: number[];
  fifoVirtualPages: number[];
  availableAddresses: Map<number,boolean>;
  deadProcesses:number[];

  constructor() {
    this.RAM = 400;
    this.pageSize = 4;
    this.availableAddresses = new Map<number,boolean>();
    this.currentMemUsage = 0;
    this.currenVirtualMemUsage=0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.trashing=0;
    this.processes = [];
    this.fifoQueue = [];
    this.deadProcesses=[];
    this.fifoStaticPages=[];
    this.fifoVirtualPages=[];
    this.pointerPageMap = new Map<Pointer, Page[]>();
    for(let i=0;i<100;i++){
      this.availableAddresses.set(i,true);
    }
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

  createPointer(size: number): Pointer {
    this.pointerConsecutive++;
    const newPointer: Pointer = new Pointer(this.pointerConsecutive, size);
    if (!this.pointerPageMap.has(newPointer)) {
      this.pointerPageMap.set(newPointer, []);
    }
    return newPointer;
  }

  cNewProcess(pid: number, size: number): void {
    var process: Process;
    //pasar de B a KB para comparar con el tamaño de la página
    const kb = size / 1000;
    //calcular el número de páginas que se necesitan
    const pages = Math.ceil(kb / this.pageSize);
    if (this.isExistingProces(pid)) {
      process = this.getProcessByID(pid);
    } else if(this.deadProcesses.includes(pid)){
      throw new Error('Process was killed before');
    }else{
      process = this.createProcess(pid);
    }
    const newPointer = this.createPointer(size);
    process.addPointer(newPointer);



  }

  cKillProcess(): void {}

  cDeleteProcess(): void {}

  isExistingProces(pid: number): boolean {
    return this.processes.some((process) => process.id === pid);
  }
 getNewSegment():number{
  for(const[key,value] of this.availableAddresses){
    if(value===false){
      this.availableAddresses.set(key,true);
      return key;
    }
  }
    throw new Error('There is not memory segmente available');
 }
 swapingPages(pidExit:number):number{
    for(const[key,values] of this.pointerPageMap){
      for(const value of values){
        if(value.getId()===pidExit){
          this.fifoVirtualPages.push(pidExit);
          this.currenVirtualMemUsage+=value.getmemoryUse()/1024;
          const segmentReturn:number = value.getSegmentDir()!;
          value.setSegmentDir(undefined);
          value.toggleRam();
          this.recalculateFragmentation(key);
          return segmentReturn;
        }
      }
    }
    throw new Error('Pagin not in the map, is not posible make the swap');

 }
 calculateFragmentation(pages:Page[]):number{
    var addFrag: number = 0;
    pages.forEach((page)=>{
      addFrag+=4-page.getmemoryUse()/1024;
    });
    return addFrag;

 }
 recalculateFragmentation(value:Pointer):void{
  const oldValues:Page[] | undefined =this.pointerPageMap.get(value);
  var newFragmentation: number=0;
  oldValues!.forEach((object)=>{
    if(object.isOnRam()){
      newFragmentation +=4-object.getmemoryUse()/1024;
    }
  });

  const newPointer:Pointer = new Pointer(value.getId(),newFragmentation);
  this.pointerPageMap.delete(value);
  this.pointerPageMap.set(newPointer, oldValues!);
 }
  printProcesses(): void {
    this.processes.forEach((process) => {
      console.log(`Process ID: ${process.id}`);
      process.printPointers();
    });
  }
}
