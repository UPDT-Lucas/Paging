import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';

export class RND implements IMMU {
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
  availableAddresses: Map<number, boolean>;
  deadProcesses: number[];

  constructor() {
    this.RAM = 20;
    this.pageSize = 4;
    this.availableAddresses = new Map<number, boolean>();
    this.currentMemUsage = 0;
    this.currenVirtualMemUsage = 0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.trashing = 0;
    this.processes = [];
    this.deadProcesses = [];
    this.loadedPages = [];
    this.pointerPageMap = new Map<Pointer, Page[]>();
    for (let i = 0; i < 100; i++) {
      this.availableAddresses.set(i, true);
    }
  }

  getClock(): number {
    return this.clock;
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

  cNewProcess(pid: number, size: number): void {
    const process = this.getOrCreateProcess(pid);
    const pagesArr: Page[] = this.allocatePages(size);
    const newPointer = this.mapPagesToPointer(pagesArr);
    this.pointerPageMap.set(newPointer, pagesArr);
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
    let pagesArr: Page[] = [];
    for (let i = 0; i < pagesNeeded; i++) {
      if (this.currentMemUsage >= this.RAM) {
        pagesArr.push(this.swapAndCreatePage());
      } else {
        pagesArr.push(this.createNewPage(size));
      }
    }
    return pagesArr;
  }

  swapAndCreatePage(): Page {
    console.log("Before swap:", this.loadedPages.map(page => page.getId()));
    this.currentMemUsage += this.pageSize;
    this.clock += 5;
    const segmentReuse: number = this.swapingPages();
    const newPage: Page = this.createNewPage(4096);
    const removedPage = this.loadedPages.find(page => page.getSegmentDir() === segmentReuse);
    if (removedPage) {
        this.loadedPages = this.loadedPages.filter(page => page !== removedPage);
    }
    console.log("Removed page:", removedPage?.getId());
    console.log("New page:", newPage.getId());
    console.log("After swap:", this.loadedPages.map(page => page.getId()));
    return newPage;
  }

  createNewPage(size: number): Page {
    this.currentMemUsage += this.pageSize;
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

  cUsePointer(pointerId: number): void{
    const pointer = this.getPointerById(pointerId);
    const pages = this.pointerPageMap.get(pointer!);
    if (!pages) {
      throw new Error('Pointer not found in the map');
    }
    let randomPages: Page[] = [];

    const pagesOnRam: Page[] = pages.filter((page) => page.isOnRam());
    pagesOnRam.forEach((page) => {
      const pageLoadedIndex = this.loadedPages.findIndex((loadedPage) => loadedPage.getId() === page.getId());
      this.loadedPages.splice(pageLoadedIndex, 1);
      randomPages.push(page);
    })

    const pagesNotOnRam: Page[] = pages.filter((page) => !page.isOnRam());
    pagesNotOnRam.forEach((page) => {
     const frame = this.getNewSegment();
      if (frame == -1) { // there is no space in the memory
        this.replacePageUse(pagesOnRam);
        page.setSegmentDir(frame);
      }else{
        page.setSegmentDir(frame);
        this.currentMemUsage += page.getmemoryUse() / 1024;
      }
      page.toggleRam();
      randomPages.push(page);
    });
    this.clock += pagesNotOnRam.length * 5;
    this.loadedPages.unshift(...randomPages);
  }

  replacePageUse(pages: Page[]): number | undefined{
    if(this.loadedPages.length == 0){
      return undefined;
    }
    const randomIndex = Math.floor(Math.random() * this.loadedPages.length);
    const pageToReplace = this.loadedPages[randomIndex];
    pageToReplace.toggleRam();
    this.loadedPages.splice(randomIndex, 1);
    return pageToReplace.getSegmentDir()!;
  }

  cKillProcess(pid: number): void {
    const process = this.getProcessByID(pid);
    const pointers = process.getPointers();
    pointers.forEach((pointer) => {
      this.cDeleteProcess(pointer.getId());
    })
    this.processes.filter((process) => process.id !== pid);
  }

  cDeleteProcess(ptrId: number): void {
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
    process.removePointer(this.getPointerById(ptrId)!);
    this.pointerPageMap.delete(pointer);
  }

  freePage(page: Page): void {
    if (this.loadedPages.includes(page)) {
      this.currentMemUsage -= page.getmemoryUse() / 1024;
      const pageLoadedIndex = this.loadedPages.findIndex((loadedPage) => loadedPage.getId() === page.getId());
      this.loadedPages.splice(pageLoadedIndex, 1);
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

  swapingPages(): number {
    const pageIndex: number = Math.floor(Math.random() * this.loadedPages.length);
    const pageToSwap: Page = this.loadedPages[pageIndex];
    for (const [key, values] of this.pointerPageMap) {
      for (const value of values) {
        if (value.getId() === pageToSwap.getId()) {
          this.currenVirtualMemUsage += value.getmemoryUse() / 1024;
          const segmentReturn: number = value.getSegmentDir()!;
          value.setSegmentDir(undefined);
          value.toggleRam();
          this.recalculateFragmentation(key);
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
    return pages.reduce((total, page) => total + (4 - page.getmemoryUse() / 1024), 0);
  }

  printProcesses(): void {
    this.processes.forEach((process) => {
      console.log(`Process ID: ${process.id}`);
      process.printPointers();
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
}
