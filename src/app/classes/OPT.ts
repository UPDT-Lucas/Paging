import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';

type ProcesoTupla = [number, Pointer, Page[]];
export class OPT implements IMMU {
  RAM: number;
  pageSize: number;
  currentMemUsage: number;
  currenVirtualMemUsage: number;
  clock: number;
  trashing: number;
  pageConsecutive: number;
  pointerConsecutive: number;
  pointerPageMap: Map<Pointer, Page[]>;
  processes: Process[];
  loadedPages: Page[];
  pointerStack: Pointer[];
  availableAddresses: Map<number, boolean>;
  deadProcesses: number[];
  removedPages: Page[] = [];
  futureList:number[] = [];
  futureIndex:number;

  constructor(futureList: number[]) {
    
    this.RAM = 400;
    this.pageSize = 4;
    this.futureList = futureList;
    this.futureIndex =0;
    this.availableAddresses = new Map<number, boolean>();
    this.currentMemUsage = 0;
    this.currenVirtualMemUsage = 0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.trashing = 0;
    this.processes = [];
    this.pointerStack = [];
    this.deadProcesses = [];
    this.loadedPages = [];
    this.pointerPageMap = new Map<Pointer, Page[]>();
    for (let i = 0; i < this.RAM / this.pageSize; i++) {
      this.availableAddresses.set(i, true);
    }
  }

  getClock(): number {
    return this.clock;
  }

  getProcesses(): Process[] {
    return this.processes;
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

  getPointerById(pointerId: number): Pointer | undefined {
    for (const [pointer, pages] of this.pointerPageMap) {
      if (pointer.getId() === pointerId) {
        return pointer;
      }
    }
    return undefined;
  }

  getPointerByPageId(pageId: number):number{
    for (const [pointer, pages] of this.pointerPageMap){
      for(const page of pages){
        if (page.getId() === pageId) {
          return pointer.getId();
        }

      }
    }
    throw new Error('Process not found');
  }

  getLastPageID(pointerPage:[number,number][]):number|undefined{
    let pointerDistances:[number,number][]=[];
   
    let numberApp:number[] =[];
    for (const [first, second] of pointerPage){
      if(numberApp.includes(second)===false){
        numberApp.push(second);
        for(let i = this.futureIndex;i<this.futureList.length;i++){
          if(second === this.futureList[i]){
            pointerDistances.push([i,second]);
            break;

          }
        }
      }
    }
    pointerDistances = pointerDistances.sort((a, b) => b[0] - a[0]);
    for(const [first,second] of pointerPage){
      if(second === pointerDistances[0][0]){
        this.futureIndex++;
        return  first;
      }
    }
    return pointerPage[0][0];
    throw new Error('There is not page to change');
  }

  selectRandomPage(toIgnore: number[]): Page {
    const swappablePages: Page[] = this.loadedPages.filter((page) => !toIgnore.includes(page.getId()));
    let pointerByPage:[number,number][] =[];
    let indexP =0;
    for(const page of swappablePages){
      pointerByPage.push([indexP,this.getPointerByPageId(page.getId())]);
      indexP++;
    }
    const lastIndex = this.getLastPageID(pointerByPage);
    return swappablePages[lastIndex!];
  }

  createProcess(pid: number): Process {
    const newProcess: Process = new Process(pid);
    this.processes.push(newProcess);
    return newProcess;
  }

  createPointer(frag: number): Pointer {
    this.pointerConsecutive++;
    const newPointer: Pointer = new Pointer(this.pointerConsecutive, frag);
    return newPointer;
  }

  getProcesoTupla(): ProcesoTupla[] | undefined {
    let logs: ProcesoTupla[] = [];
    for (const point of this.pointerStack) {
      const pages = this.searchPagesbyPointerId(point.getId());
      logs.push([this.getProcessByPointerId(point.getId()).getId(), point, pages]);
    }
    return logs;
  }

  cNewProcess(pid: number, size: number): ProcesoTupla[] | undefined {
    const process = this.getOrCreateProcess(pid);
    const pagesArr: Page[] = this.allocatePages(size);
    const newPointer = this.mapPagesToPointer(pagesArr);
    this.pointerPageMap.set(newPointer, pagesArr);
    process.addPointer(newPointer);
    this.pointerStack.push(newPointer);
    return this.getProcesoTupla();
  }

  searchPagesbyPointerId(pi: number): Page[] {
    for (const [key, value] of this.pointerPageMap) {
      if (key.getId() === pi) {
        return value;
      }
    }
    throw new Error('There is not a pointer with this id so there no exist pages for return');
  }

  getOrCreateProcess(pid: number): Process {
    if (this.isExistingProces(pid)) {
      return this.getProcessByID(pid);
    } else if (this.deadProcesses.includes(pid)) {
      throw new Error('Process was killed before');
    } else {
      return this.createProcess(pid);
    }
  }

  allocatePages(size: number): Page[] {
    const pagesNeeded: number = Math.ceil(size / 4096);
    let toIgnore: number[] = [];
    for (let i = 0; i < pagesNeeded; i++) {
      toIgnore[i] = this.pageConsecutive + i;
    }
    let remainingSpace: number = size;
    let pageSpace: number = 0;
    let pagesArr: Page[] = [];
    for (let i = 0; i < pagesNeeded; i++) {
      if (remainingSpace > 4096) {
        pageSpace = 4096;
      } else {
        pageSpace = remainingSpace;
      }
      if (this.currentMemUsage >= this.RAM) {
        pagesArr.push(this.swapAndCreatePage(pageSpace, toIgnore));
      } else {
        pagesArr.push(this.createNewPage(pageSpace));
      }
      remainingSpace -= 4096;
    }
    return pagesArr;
  }

  swapAndCreatePage(size: number, toIgnorePages: number[]): Page {
    this.clock += 5;
    this.trashing += 5;
    const segmentReuse: number = this.swapingPages(toIgnorePages);
    const newPage: Page = new Page(this.pageConsecutive++, true, true, segmentReuse, size);
    this.loadedPages.push(newPage);
    return newPage;
  }

  createNewPage(size: number): Page {
    this.currentMemUsage += 4;
    this.clock += 1;
    const freeSegment: number = this.getNewSegment();
    const newPage: Page = new Page(this.pageConsecutive++, true, true, freeSegment, size);
    this.loadedPages.push(newPage);
    return newPage;
  }

  mapPagesToPointer(pagesArr: Page[]): Pointer {
    const frag = this.calculateFragmentation(pagesArr);
    const newPointer = this.createPointer(frag);
    return newPointer;
  }

  cUsePointer(pointerId: number): ProcesoTupla[] | undefined {
    const pointer = this.getPointerById(pointerId);
    const pages = this.pointerPageMap.get(pointer!);
    if (!pages) {
      throw new Error('Pointer not found in the map');
    }
    let rndPages: Page[] = [];

    const pagesOnRam: Page[] = pages.filter((page) => page.isOnRam());
    pagesOnRam.forEach((page) => {
      const pageLoadedIndex = this.loadedPages.findIndex((loadedPage) => loadedPage.getId() === page.getId());
      this.loadedPages.splice(pageLoadedIndex, 1);
      rndPages.push(page);
    })

    const pagesNotOnRam: Page[] = pages.filter((page) => !page.isOnRam());
    pagesNotOnRam.forEach((page) => {
      let frame = this.getNewSegment();
      if (frame == -1) {
        frame = this.replacePageUse(pagesOnRam);
        page.setSegmentDir(frame);
      } else {
        page.setSegmentDir(frame);
        this.currentMemUsage += 4;
      }
      page.toggleRam();
      pagesOnRam.push(page);
      rndPages.push(page);

      this.currenVirtualMemUsage -= page.getmemoryUse() / 1024;
      if(this.currenVirtualMemUsage < 0){
        this.currenVirtualMemUsage = 0;
      }

    });
    this.loadedPages.push(...rndPages);
    this.clock += pagesNotOnRam.length * 5;
    this.trashing += pagesNotOnRam.length * 5;
    this.clock += pagesOnRam.length * 1;


    return this.getProcesoTupla();
  }

  replacePageUse(pages: Page[]): number {
    const loadedReverse = this.loadedPages.reverse();
    const pageToRemove = loadedReverse.find((page) => !pages.includes(page));
    if (pageToRemove) {
      this.loadedPages = this.loadedPages.filter((page) => page !== pageToRemove);
      pageToRemove.toggleRam();
    }
    this.loadedPages.reverse();
    return pageToRemove!.getSegmentDir()!;
  }


  cKillProcess(pid: number): ProcesoTupla[] | undefined {
    const process = this.getProcessByID(pid);
    const pointers = process.getPointers();
    pointers.forEach((pointer) => {
      this.cDeleteProcess(pointer.getId());
    })
    this.processes = this.processes.filter((process) => process.id !== pid);

    return this.getProcesoTupla();
  }

  cDeleteProcess(ptrId: number): ProcesoTupla[] | undefined {
    const pointer = this.getPointerById(ptrId);
    if (!pointer) {
      throw new Error('Pointer not found');
    }
    const pages = this.pointerPageMap.get(pointer);
    if (!pages) {
      throw new Error('Pointer not found in the map');
    }
    pages.forEach((page) => {
      this.freePage(page);
    });
    const process = this.getProcessByPointerId(ptrId);
    const ptr = this.getPointerById(ptrId)!
    process.removePointer(ptr);
    this.pointerPageMap.delete(pointer);
    this.pointerStack = this.pointerStack.filter(obj => obj.getId() !== pointer.getId());

    return this.getProcesoTupla();
  }

  freePage(page: Page): void {
    if (this.loadedPages.includes(page)) {
      const pageLoadedIndex = this.loadedPages.find((loadedPage) => loadedPage === page);
      this.loadedPages = this.loadedPages.filter((page) => page !== pageLoadedIndex);
      this.availableAddresses.set(page.getSegmentDir()!, true);
      this.currentMemUsage -= 4;
      this.currenVirtualMemUsage -= page.getmemoryUse() / 1024;
      if(this.currenVirtualMemUsage < 0){
        this.currenVirtualMemUsage = 0;
      }
    }
  }

  isExistingProces(pid: number): boolean {
    return this.processes.some((process) => process.id === pid);
  }

  getNewSegment(): number {
    for (const [key, value] of this.availableAddresses) {
      if (value === true) {
        this.availableAddresses.set(key, false);
        return key;
      }
    }
    return -1;
  }

  //tengo que hacer que me ignore si es una pagina del mismo puntero
  //porque si no va intentar buscar una pagina que no existe todavia
  swapingPages(toIgnore: number[]): number {
    let toRemove: Page;
    toRemove = this.selectRandomPage(toIgnore);
    this.removedPages.push(toRemove)
    for (const [key, values] of this.pointerPageMap) {
      for (const value of values) {
        if (value === toRemove) {
          this.currenVirtualMemUsage += value.getmemoryUse() / 1024;
          let segmentReturn: number = value.getSegmentDir()!;
          value.toggleRam();
          value.setSegmentDir(undefined);
          this.recalculateFragmentation(key);
          this.loadedPages = this.loadedPages.filter((page) => page.getId() !== value.getId());
          return segmentReturn;
        }
      }
    }
    throw new Error('Pagin not in the map, is not posible make the swap');
  }

  calculateFragmentation(pages: Page[]): number {
    return this.calculatePageFragmentation(pages);
  }

  recalculateFragmentation(value: Pointer): void {
    const oldValues = this.pointerPageMap.get(value);
    const newFragmentation = this.calculatePageFragmentation(oldValues!);
    const newPointer = new Pointer(value.getId(), newFragmentation);
    this.pointerPageMap.delete(value);
    this.pointerPageMap.set(newPointer, oldValues!);
  }

  private calculatePageFragmentation(pages: Page[]): number {
    let fragmentation: number = 0;
    pages.forEach((page) => {
      fragmentation += 4096 - page.getmemoryUse();
    });
    return fragmentation;
  }

  getLoadedPages(): Page[] {
    return this.loadedPages;
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

  printProcessPages(): void {
    this.pointerPageMap.forEach((pages, pointer) => {
      console.log(`Pointer ID: ${pointer.getId()}`);
      pages.forEach((page) => {
        console.log(`Page ID: ${page.getId()}`);
      });
    })
  }

  printRecentlyUsed(): void {
    console.log(this.loadedPages);
  }

  printPagesOnRam(): void {
    for (const [key, values] of this.pointerPageMap) {
      for (const value of values) {
        if (value.isOnRam()) {
          console.log(value)
        }
      }
    }
  }
}
