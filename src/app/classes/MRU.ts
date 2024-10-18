import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';
type ProcesoTupla = [number, Pointer, Page[]];
export class MRU implements IMMU {
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
  fifoQueue: Process[];
  pointerStack:Pointer[];
  recentlyUsedPages: number[];
  loadedPages: Page[];
  availableAddresses: Map<number, boolean>;
  deadProcesses: number[];

  constructor() {
    this.RAM = 400;
    this.pageSize = 4;
    this.availableAddresses = new Map<number, boolean>();
    this.currentMemUsage = 0;
    this.currenVirtualMemUsage = 0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.trashing = 0;
   
    this.processes = [];
    this.fifoQueue = [];
    this.pointerStack=[];
    this.deadProcesses = [];
    this.recentlyUsedPages = [];
    this.loadedPages = [];
    this.pointerPageMap = new Map<Pointer, Page[]>();
    for (let i = 0; i < this.RAM / this.pageSize; i++) {
      this.availableAddresses.set(i, true);
    }
  }

  getClock(): number {
    return this.clock;
  }

  getTrashing(): number {
    return this.trashing;
  }

  getCurrentMemUsage(): number {
    return this.currentMemUsage;
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
   getProcesoTupla():ProcesoTupla[] | undefined {
      let logs:ProcesoTupla[] = []; 
      
      for(const point of this.pointerStack){
        
        const pages = this.searchPagesbyPointerId(point.getId());
        logs.push([this.getProcessByPointerId(point.getId()).getId(),point,pages]);
      }
      return logs;
    }
  cNewProcess(pid: number, size: number): ProcesoTupla[] | undefined  {
    const process = this.getOrCreateProcess(pid);
    const pagesArr: Page[] = this.allocatePages(size);
    const newPointer = this.mapPagesToPointer(pagesArr);
    this.pointerPageMap.set(newPointer, pagesArr);
    process.addPointer(newPointer);
    this.pointerStack.push(newPointer);
    
    return this.getProcesoTupla();

  }
  searchPagesbyPointerId(pi:number):Page[] {
    for(const[key,value] of this.pointerPageMap){
      if(key.getId()===pi){
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
    let remainingSpace: number = size;
    let last: number = 0;
    let pageSpace: number = 0;
    if(pagesNeeded > 1){
      last = this.loadedPages.length;
    }
    console.log(this.currentMemUsage)
    const toIgnoreIndexes = this.recentlyUsedPages.slice(0, last)
    let pagesArr: Page[] = [];
    for (let i = 0; i < pagesNeeded; i++) {
      if (this.currentMemUsage >= this.RAM) {
        if(remainingSpace > 4096){
          pageSpace = 4096;
        }else{
          pageSpace = remainingSpace;
        }
        pagesArr.push(this.swapAndCreatePage(pageSpace, toIgnoreIndexes));
      } else {
        pagesArr.push(this.createNewPage(size));
      }
      if(remainingSpace < 4096){
        this.trashing += remainingSpace;
      }
      remainingSpace -= 4096;
    }
    return pagesArr;
  }

  swapAndCreatePage(size: number, toIgnoreIndexes: number []): Page {
    this.clock += 5;
    const segmentReuse: number = this.swapingPages(toIgnoreIndexes);
    const newPage: Page = new Page(this.pageConsecutive++, true, true, segmentReuse, size);
    this.updateRecentlyUsed(newPage.getId());
    this.loadedPages.push(newPage);
    return newPage;
  }

  createNewPage(size: number): Page {
    this.currentMemUsage += 4;
    this.clock += 1;
    const freeSegment: number = this.getNewSegment();
    const newPage: Page = new Page(this.pageConsecutive++, true, true, freeSegment, size);
    this.updateRecentlyUsed(newPage.getId());
    this.loadedPages.push(newPage);
    return newPage;
  }

  updateRecentlyUsed(pageId: number): void {
    const index = this.recentlyUsedPages.indexOf(pageId);
    if (index !== -1) {
      this.recentlyUsedPages.splice(index, 1);
    }
    this.recentlyUsedPages.push(pageId);
  }

  mapPagesToPointer(pagesArr: Page[]): Pointer {
    const frag = this.calculateFragmentation(pagesArr);
    const newPointer = this.createPointer(frag);
    return newPointer;
  }

  cUsePointer(pointerId: number): ProcesoTupla[]|undefined  {
    const pointer = this.getPointerById(pointerId);
    const pages = this.pointerPageMap.get(pointer!);
    if (!pages) {
      throw new Error('Pointer not found in the map');
    }
    let mruPages: Page[] = [];

    const pagesOnRam: Page[] = pages.filter((page) => page.isOnRam());
    pagesOnRam.forEach((page) => {
      const pageLoadedIndex = this.loadedPages.findIndex((loadedPage) => loadedPage.getId() === page.getId());
      this.loadedPages.splice(pageLoadedIndex, 1);
      mruPages.push(page);
      //! Cambié esto para que cuando hago un use de algo en RAM igual me
      //! lo ponga en la lista de recientemente usados para el reemplazo
      this.recentlyUsedPages = this.recentlyUsedPages.filter((page) => page !== pageLoadedIndex);
      this.recentlyUsedPages.push(page.getId());
    })

    const pagesNotOnRam: Page[] = pages.filter((page) => !page.isOnRam());
    pagesNotOnRam.forEach((page) => {
      let frame = this.getNewSegment();
      if (frame == -1) {
        frame = this.replacePageUse(pagesOnRam);
        page.setSegmentDir(frame);
      } else {
        page.setSegmentDir(frame);
        this.currentMemUsage += page.getmemoryUse() / 1024;
      }
      page.toggleRam();
      pagesOnRam.push(page);
      mruPages.push(page);
      this.recentlyUsedPages.pop();
      this.recentlyUsedPages.push(page.getId());
    });
    this.loadedPages.push(...mruPages);
    this.clock += pagesNotOnRam.length * 5;
    this.trashing +=pagesNotOnRam.length * 5;
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


  cKillProcess(pid: number): ProcesoTupla[]|undefined {
    const process = this.getProcessByID(pid);
    const pointers = process.getPointers();
    pointers.forEach((pointer) => {
      this.cDeleteProcess(pointer.getId());
    })
    this.processes = this.processes.filter((process) => process.id !== pid);
    return this.getProcesoTupla();
  }

  cDeleteProcess(ptrId: number): ProcesoTupla[]|undefined  {
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
    this.pointerStack=this.pointerStack.filter(obj => obj.getId() !== pointer.getId());
    return this.getProcesoTupla();

  }

  freePage(page: Page): void {
    if (this.recentlyUsedPages.includes(page.getId())) {
      this.currentMemUsage -= page.getmemoryUse() / 1024;
      const pageLoadedIndex = this.recentlyUsedPages.find((loadedPage) => loadedPage === page.getId());
      this.recentlyUsedPages = this.recentlyUsedPages.filter((page) => page !== pageLoadedIndex);
      this.availableAddresses.set(page.getSegmentDir()!, true);
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
    let toRemove: number | undefined;
    if(toIgnore.length === 0){
      toRemove = this.recentlyUsedPages.pop();
    }else{
      toRemove = toIgnore.pop()
      this.recentlyUsedPages = this.recentlyUsedPages.filter((page) => page !== toRemove);
    }
    console.log(this.recentlyUsedPages)
    console.log("removing", toRemove)
    for (const [key, values] of this.pointerPageMap) {
      for (const value of values) {
        if (value.getId() === toRemove) {
          this.currenVirtualMemUsage += value.getmemoryUse() / 1024;
          const segmentReturn: number = value.getSegmentDir()!;
          value.setSegmentDir(undefined);
          value.toggleRam();
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
      if(page.getmemoryUse() != 4096){
        fragmentation += page.getmemoryUse();
      }
    });
    return fragmentation;
  }

  getLoadedPages(): Page[] {
    return this.loadedPages;
  }

  printProcesses(): void {
    console.log(this.processes)
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
    console.log(this.recentlyUsedPages);
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
