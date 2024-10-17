import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';

export class SecondChance implements IMMU {
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
  fifoStaticPages: Page[];
  //fifoVirtualPages: number[];
  availableAddresses: Map<number|null|undefined,boolean>;
  deadProcesses:number[];

  constructor() {
    this.RAM = 400;
    this.pageSize = 4;
    this.availableAddresses = new Map<number|null|undefined,boolean>();
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
    //this.fifoVirtualPages=[];
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
    } else if(this.deadProcesses.includes(pid)){
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

        if(this.currentMemUsage>=400){

          this.clock +=5;
          this.trashing+=5;
          const exitID:number | undefined = this.getIdSecondChance(null);
          const segmentReuse:number|null|undefined = this.swapingPages(exitID);
          let bytesDif:number=0;
          if(pagesCal<1){
            bytesDif = pagesCal*4096;

          }else{
            bytesDif = 4096;
            pagesCal--;
          }
          const newPage:Page = new Page(this.pageConsecutive,true,false,segmentReuse,bytesDif);


          this.pageConsecutive++;
          pagesArr.push(newPage);
          this.fifoStaticPages.push(newPage);

        }else{
          this.currentMemUsage+=4;
          this.clock +=1;

          const freeSegment:number|null|undefined = this.getNewSegment();
          let bytesDif:number=0;
          if(pagesCal<1){
            bytesDif = pagesCal*4096;

          }else{
            bytesDif = 4096;
            pagesCal--;
          }
          const newPage:Page = new Page(this.pageConsecutive,true,false,freeSegment,bytesDif);
          this.pageConsecutive++;
          this.fifoStaticPages.push(newPage);
          pagesArr.push(newPage);
        }

      }

      newPointer = this.createPointer(this.calculateFragmentation(pagesArr));
      this.pointerPageMap.set(newPointer,pagesArr);

    }else{

      let pagesArr:Page[]=[];

      if(this.currentMemUsage>=400){

          this.clock +=5;
          this.trashing+=5;
          const exitID:number|undefined = this.getIdSecondChance(null);
          const segmentReuse:number|null|undefined = this.swapingPages(exitID);

          const newPage:Page = new Page(this.pageConsecutive,true,false,segmentReuse,size);

          this.pageConsecutive++;
          this.fifoStaticPages.push(newPage);
          pagesArr.push(newPage);

        }else{
          this.currentMemUsage+=4;
          this.clock +=1;

          const freeSegment:number|null|undefined = this.getNewSegment();


          const newPage:Page = new Page(this.pageConsecutive,true,false,freeSegment,size);
          this.pageConsecutive++;
          this.fifoStaticPages.push(newPage);
          pagesArr.push(newPage);
        }
        newPointer = this.createPointer(this.calculateFragmentation(pagesArr));
        this.pointerPageMap.set(newPointer,pagesArr);


    }
    process.addPointer(newPointer);
    //this.printProcesses();
  }

  getIdSecondChance(pages:Page[]|null):number|undefined{
    let index:number =0;
    if(pages!==null){

      for(const page of this.fifoStaticPages){
        if(pages.some(objeto => objeto.getId() === page.getId())){
          if(page.getBit()===false){
            page.toggleBit();
          }
        }else{
         if(page.getBit()===false){
            this.fifoStaticPages.splice(index,1);
            return page.getId();
         }else{
            page.toggleBit();
         }
        }
         index++;

      }
      throw new Error('There is not an id for the SecondChance process');
    }else{
      for(const page of this.fifoStaticPages){
         if(page.getBit()===false){
            this.fifoStaticPages.splice(index,1);
            return page.getId();
         }else{
            page.toggleBit();
         }
         index++;
      }
      throw new Error('There is not an id for the SecondChance process');
    }


  }

  cKillProcess(pid:number): void {
   const proc = this.processes.find(obj => obj.getId() === pid);
   const procInd = this.processes.findIndex(obj => obj.getId() === pid);
   if(proc!==undefined){
      const pointers = proc.getPointers();
      if(pointers.length>0 && procInd !==-1){
        for(const point of pointers){
          this.cDeleteProcess(point.getId());
        }
          this.processes.splice(procInd, 1);
      }
     }

  }
  getClock():number{
    return this.clock;
  }

  cDeleteProcess(pi:number): void {
    this.deletePointerMap(pi);
    const pag:Page[]=this.searchPagesbyPointerId(pi);

    for(const page of pag){
      if(page.getSegmentDir()!=null){
        this.currentMemUsage-=4;
        this.availableAddresses.set(page.getSegmentDir(),true);
        const  index = this.fifoStaticPages.findIndex(objeto => objeto.getId() === page.getId());
        this.fifoStaticPages.splice(index,1);

      }else if(page.getSegmentDir()==null){
        this.currenVirtualMemUsage-=page.getmemoryUse()/1024;
        //const  index = this.fifoVirtualPages.indexOf(page.getId());
        //this.fifoVirtualPages.splice(index,1);
      }

    }
    this.DeletePointerbyPointerId(pi);
  }

  cUsePointer(pid:number){
    const pages:Page[]=this.searchPagesbyPointerId(pid);
    for(const page of pages){
      if(page.isOnRam()){
        this.clock+=1;
        if(page.getBit()===false){
          page.toggleBit();
        }

      }else{
        this.clock+=5;
        this.trashing+=5;
        this.currenVirtualMemUsage-=page.getmemoryUse()/1024;
        if(this.currentMemUsage>=400){
          const exitID:number|undefined = this.getIdSecondChance(pages);
          const segmentReuse:number|null|undefined = this.swapingPages(exitID);
          page.toggleRam();
          page.toggleBit();
          page.setSegmentDir(segmentReuse);
        }else{
          this.currentMemUsage+=4;
          page.toggleRam();
          page.toggleBit();
          page.setSegmentDir(this.getNewSegment());
        }
        this.fifoStaticPages.push(page);
        const point:Pointer = this.searchPointerByPointerId(pid);
        this.recalculateFragmentation(point);



      }
    }

  }

  DeletePointerbyPointerId(pi:number):boolean{
    for(const[key,value] of this.pointerPageMap){
      if(key.getId()===pi){
        this.pointerPageMap.delete(key);
        return true;
      }
    }
    throw new Error('There is not a pointer with this id,imposible to delete');
  }

  searchPagesbyPointerId(pi:number):Page[] {
    for(const[key,value] of this.pointerPageMap){
      if(key.getId()===pi){
        return value;
      }
    }
    throw new Error('There is not a pointer with this id so there no exist pages for return');
  }
  searchPointerByPointerId(pid:number):Pointer{
    for(const[key,value] of this.pointerPageMap){
      if(key.getId()===pid){
        return key;
      }
    }
    throw new Error('There is not a pointer with this id so there no exist pages for return');
  }
  deletePointerMap(pid:number):boolean{
    for(const proc of this.processes){
      for(const point of proc.getPointers()){
        if(point.getId()===pid){
          proc.removePointer(point);
          return true;
        }

      }
    }

    throw new Error('The pointer to delete dont exist at the processes');
  }
  isExistingProces(pid: number): boolean {
    return this.processes.some((process) => process.id === pid);
  }
 getNewSegment():number|null|undefined{
  for(const[key,value] of this.availableAddresses){
    if(value===true){
      this.availableAddresses.set(key,false);
      return key;
    }
  }
    throw new Error('There is not memory segmente available');
 }
 swapingPages(pidExit:number|null|undefined):number|null|undefined{
    for(const[key,values] of this.pointerPageMap){
      for(const value of values){
        if(value.getId()===pidExit){

          //this.fifoVirtualPages.push(pidExit);
          this.currenVirtualMemUsage+=value.getmemoryUse()/1024;
          const segmentReturn:number|null|undefined= value.getSegmentDir();
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
    let addFrag:number=0;
    pages.forEach((page)=>{
      addFrag+=4-page.getmemoryUse()/1024;
    });
    return addFrag;

 }


 recalculateFragmentation(value:Pointer):void{
  const oldValues:Page[]|undefined=this.pointerPageMap.get(value);
  if(oldValues!==undefined){
    let newFragmentation: number=0;
    oldValues.forEach((object)=>{
      if(object.isOnRam()){
        newFragmentation +=4-object.getmemoryUse()/1024;
      }
    });
    const newPointer:Pointer = new Pointer(value.getId(),newFragmentation);

    this.pointerPageMap.set(newPointer,oldValues);
    for(const proc of this.processes){
      const poinP = proc.getPointers().findIndex(puntero => puntero.getId() === newPointer.getId());
      if (poinP !== -1) {
        proc.getPointers()[poinP] = newPointer;
        break;
      }

    }
    this.pointerPageMap.delete(value);

  }
 }
  totalFrag():number{
    let totalFrag:number=0;
    for(const[key,values] of this.pointerPageMap){
      totalFrag+=key.getFragmentation();
    }
    return totalFrag;
  }

  printProcesses(): void {
    console.log("currentMemUsage: ",this.currentMemUsage);
    console.log("currenVirtualMemUsage: ",this.currenVirtualMemUsage);
    console.log("clock: ",this.clock);
    console.log("trashing: ",this.trashing);
    console.log("Fragmentation",this.totalFrag());
    this.processes.forEach((process) => {
    console.log(`Process ID: ${process.id}`);

      for(const point of process.getPointers()){
        const pages = this.pointerPageMap.get(point);
        if(pages!==undefined){
            console.log(`Id de puntero : ${point.getId()}`);
            for(const pag of pages){
              console.log("Datos de la pagina asociada al puntero:", pag);
            }
        }

      }
    });
  }
}
