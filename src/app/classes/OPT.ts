import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';
import { cloneDeep } from 'lodash';
type ProcesoTupla = [number, Pointer, Page[]];
export class OPT implements IMMU {
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
  pointerStack:Pointer[];
  //fifoVirtualPages: number[];
  availableAddresses: Map<number|null|undefined,boolean>;
  deadProcesses:number[];
  futureList:number[];
  futureIndex:number;

  constructor(futureList:number[]) {
    this.RAM = 400;
    this.pageSize = 4;
    this.availableAddresses = new Map<number|null|undefined,boolean>();
    this.currentMemUsage = 0;
    this.currenVirtualMemUsage=0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.trashing=0;

    this.futureList=futureList;
    this.futureIndex =0;

    this.processes = [];
    this.fifoQueue = [];
    this.deadProcesses=[];
    this.fifoStaticPages=[];
    this.pointerStack=[];

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

  getTrashing(): number {
    return this.trashing;
  }

  getCurrentMemUsage(): number {
    return this.currentMemUsage;
  }

  getCurrentVirtualMemUsage(): number {
    return this.currenVirtualMemUsage;
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
  addPageToPointer(idPointer: number, page: Page): void {
    let searchPointer: Pointer | undefined;
    this.pointerPageMap.forEach((value, key) => {
        if (key.getId() === idPointer) {
            searchPointer = key;
        }
    });
    if (searchPointer) {
        const pages = this.pointerPageMap.get(searchPointer);
        if (pages) {
            pages.push(page);
        } else {
            this.pointerPageMap.set(searchPointer, [page]);
        }
    } else {
        console.error(`Pointer with ID ${idPointer} not found.`);
    }
}

  cNewProcess(pid: number, size: number): ProcesoTupla[] | undefined  {
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
    newPointer = this.createPointer(this.calculateFragmentation(null));
    this.pointerPageMap.set(newPointer,[]);
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
          this.addPageToPointer(newPointer.getId(),newPage);
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
          this.addPageToPointer(newPointer.getId(),newPage);
        }

      }

      this.recalculateFragmentation(newPointer);

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
          this.addPageToPointer(newPointer.getId(),newPage);

        }else{
          this.currentMemUsage+=4;
          this.clock +=1;

          const freeSegment:number|null|undefined = this.getNewSegment();


          const newPage:Page = new Page(this.pageConsecutive,true,false,freeSegment,size);
          this.pageConsecutive++;
          this.fifoStaticPages.push(newPage);
          this.addPageToPointer(newPointer.getId(),newPage);
        }
        this.recalculateFragmentation(newPointer);


    }
    process.addPointer(newPointer);
    this.pointerStack.push(newPointer);
    return this.getProcesoTupla();

    //this.printProcesses();
  }
  getProcesoTupla():ProcesoTupla[] | undefined {
    let logs:ProcesoTupla[] = [];

    for(const point of this.pointerStack){

      const pages = this.searchPagesbyPointerId(point.getId());
      logs.push([this.getProcessByPointerId(point.getId()).getId(),this.searchPointerByPointerId(point.getId()),pages]);
    }
    return logs;
}

  getPointerIdByPageId(pid:number):number{


    for(const [key,values] of this.pointerPageMap){
      for(const value of values){
        if(value.getId() === pid){
          return key.getId();
        }
      }
    }
    throw new Error('Process not found');
  }

  getIdSecondChance(pages:Page[]|null):number|undefined{

    let pagesForChange:Page[];

    if(pages!==null){

      pagesForChange =  this.fifoStaticPages.filter((page) => !pages.some(otherPage => otherPage.getId() === page.getId()));
    }else{

      pagesForChange = this.fifoStaticPages;
    }
    let pageIdPerPointer:[number,number][]=[];

    for(const page of pagesForChange){
      pageIdPerPointer.push([page.getId(),this.getPointerIdByPageId(page.getId())]);
    }

    let pageApp:[number|null,number][] = [];
    let appearsPages:number[]=[];
    let copiedArray = cloneDeep(this.futureList.slice());
    copiedArray.splice(0,this.futureIndex);
    for(const [pageId,pointerId] of pageIdPerPointer){
      if(!appearsPages.includes(pointerId)){
        appearsPages.push(pointerId);
        if(copiedArray.includes(pointerId)){

            pageApp.push([copiedArray.indexOf(pointerId),pointerId]);

        }else{

            pageApp.push([null,pointerId]);

        }
      }
    }
    pageApp.sort((a, b) => {

        if (a[0] === null) return -1;

        if (b[0] === null) return 1;

        return (b[0] as number) - (a[0] as number);
    });
    for(const[pageId,pointerId] of pageIdPerPointer){
        if(pointerId === pageApp[0][1]){
            this.fifoStaticPages = this.fifoStaticPages.filter(item => item.getId() !== pageId);
            return pageId;
        }

    }
    throw new Error('There is no page to change to the future');

  }

  cKillProcess(pid:number): ProcesoTupla[] | undefined  {
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
     return this.getProcesoTupla();
  }
  getClock():number{
    return this.clock;
  }

  cDeleteProcess(pi:number): ProcesoTupla[] | undefined  {
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
    this.pointerStack=this.pointerStack.filter(obj => obj.getId() !== pi);
    return this.getProcesoTupla();
  }

  cUsePointer(pid:number){
    this.futureIndex++;
    const pages:Page[]=this.searchPagesbyPointerId(pid);
    for(const page of pages){
      if(page.isOnRam()){
        this.clock+=1;

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
    return this.getProcesoTupla();
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
 calculateFragmentation(pages:Page[]|null):number{
    let addFrag:number=0;
    if(pages !== null){
      pages.forEach((page)=>{
        addFrag+=4-page.getmemoryUse()/1024;
      });
    }
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
    const index = this.pointerStack.findIndex(obj => obj.getId() === newPointer.getId());

    if (index !== -1) {
      // Reemplaza el objeto en el índice encontrado con el nuevo objeto
      this.pointerStack[index] = newPointer;
    }

  }
 }
  totalFrag():number{
    let totalFrag:number=0;
    for(const[key,values] of this.pointerPageMap){
      totalFrag+=key.getFragmentation();
    }
    return totalFrag;
  }
  getLoadedPages(): Page[] {
    let loadedPages=[];
    for(const[key,values] of this.pointerPageMap){
      for(const page of values){
        if(this.fifoStaticPages.some(p => p.getId() === page.getId())){
          loadedPages.push(page);
        }
      }
    }
    return loadedPages;
  }

  printProcesses(): void {
    console.log("currentMemUsage: ",this.currentMemUsage);
    console.log("currenVirtualMemUsage: ",this.currenVirtualMemUsage);
    console.log("clock: ",this.clock);
    console.log("trashing: ",this.trashing);
    console.log("Fragmentation",this.totalFrag());
  }
}
