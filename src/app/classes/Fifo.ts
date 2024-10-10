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
      availableAddresses.set(i,true);
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

  createPointer(frag:number): Pointer {
    this.pointerConsecutive++;
    const newPointer: Pointer = new Pointer(this.pointerConsecutive, frag);
    return newPointer;
  }

  cNewProcess(pid: number, size: number): void {
    //bytesSize = size / 1000;
    //const exactPages = Math.ceil(kb / this.pageSize);
    var process: Process;

    if (this.isExistingProces(pid)) {
      process = this.getProcessByID(pid);
    } else if(deadProcesses.includes(pid)){
      throw new Error('Process was killed before');
    }else{
      process = this.createProcess(pid);
    }

    let newPointer:Pointer;
    if(size>4096){
      const pagesNeeded :number =  Math.ceil(size/4096);
      let pagesCal :number=size/4096;
      let pagesArr:Page[]=[];
      for(let i = 0;i<pagesNeeded;i++){
        if(this.currentMemUsage>==400){
          this.fifoStaticPages.push(this.pageConsecutive);
          this.clock +=5;
          const exitID:number = this.fifoStaticPages.shift();
          const segmentReuse:number = this.swapingPages(exitID);
          const bytesDif:number;
          if(pagesCal<1){
            bytesDif = pagesCal*4096;

          }else{
            bytesDif = 4096;
            pagesCal--;
          }
          const newPage:Page = new Page(this.pageConsecutive,true,true,segmentReuse,bytesDif);

          this.pageConsecutive++;
          pagesArr.push(newPage);

        }else{
          this.currentMemUsage+=4;
          this.clock +=1;
          this.fifoStaticPages.push(this.pageConsecutive);
          const freeSegment:number = getNewSegment();
          const bytesDif:number;
          if(pagesCal<1){
            bytesDif = pagesCal*4096;

          }else{
            bytesDif = 4096;
            pagesCal--;
          }
          const newPage:Page = new Page(this.pageConsecutive,true,true,freeSegment,bytesDif);
          this.pageConsecutive++;
          pagesArr.push(newPage);
        }
      }
      newPointer = this.createPointer(calculateFragmentation(pagesArr));
      this.pointerPageMap.set(newPointer,pagesArr);
      
    }else{

      let pagesArr:Page[]=[];

      if(this.currentMemUsage>==400){
          this.fifoStaticPages.push(this.pageConsecutive);
          this.clock +=5;
          const exitID:number = this.fifoStaticPages.shift();
          const segmentReuse:number = this.swapingPages(exitID);
          const bytesDif:number;
          const newPage:Page = new Page(this.pageConsecutive,true,true,segmentReuse,size);

          this.pageConsecutive++;
          pagesArr.push(newPage);

        }else{
          this.currentMemUsage+=4;
          this.clock +=1;
          this.fifoStaticPages.push(this.pageConsecutive);
          const freeSegment:number = getNewSegment();
          const bytesDif:number;
        
          const newPage:Page = new Page(this.pageConsecutive,true,true,freeSegment,size);
          this.pageConsecutive++;
          pagesArr.push(newPage);
        }


    }
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
          const segmentReturn:number = value.getSegmentDir();
          value.setSegmentDir(null);
          value.toggleRam();
          this.recalculateFragmentation(key);
          return segmentReturn; 
        }
      }
    }
    throw new Error('Pagin not in the map, is not posible make the swap');

 }
 calculateFragmentation(pages:Page[]):number{
    const addFrag:number;
    pages.forEach((page)=>{
      addFrag+=4-page.getmemoryUse()/1024;
    });
    return addFrag;

 }
 recalculateFragmentation(value:Pointer):void{
  const oldValues:Page[]=this.pointerPageMap.get(value);
  const newFragmentation: number=0;
  oldValues.forEach((object)=>{
    if(object.isOnRam){
      newFragmentation +=4-object.getmemoryUse()/1024;
    }
  });

  const newPointer:Pointer = new Pointer(value.getId(),newFragmentation);
  this.pointerPageMap.delete(value);
  this,pointerPageMap.set(newPointer,oldValues);
 }
  printProcesses(): void {
    this.processes.forEach((process) => {
      console.log(`Process ID: ${process.id}`);
      process.printPointers();
    });
  }
}
