import { IMMU } from './../interfaces/IMMU';
import { Page } from './Page';
import { Process } from './Process';
import { Pointer } from './Pointer';
import Rand from 'rand-seed';

export class RND implements IMMU {
  RAM: number;
  pageSize: number;
  currentMemUsage: number;
  currentVirtualMemUsage: number;
  clock: number;
  trashing: number;
  pageConsecutive: number;
  pointerConsecutive: number;
  pointerPageMap: Map<Pointer, Page[]>;
  processes: Process[];
  loadedPages: Page[];
  availableAddresses: Map<number, boolean>;
  deadProcesses: number[];
  seed: string;
  random: Rand;


  constructor(seed: string) {
    this.seed = seed;
    this.random = new Rand(seed);
    this.RAM = 40;
    this.pageSize = 4;
    this.availableAddresses = new Map<number, boolean>();
    this.currentMemUsage = 0;
    this.currentVirtualMemUsage = 0;
    this.clock = 0;
    this.pageConsecutive = 0;
    this.pointerConsecutive = 0;
    this.trashing = 0;
    this.processes = [];
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

  getTrashing(): number {
    return this.trashing / 1000;
  }

  getCurrentMemUsage(): number {
    return this.currentMemUsage;
  }

  getVirtualMemUsage(): number {
    return this.currentVirtualMemUsage;
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

  private selectRandomPage(toIgnore: number[]): Page {
    const swappablePages: Page[] = this.loadedPages.filter((page) => !toIgnore.includes(page.getId()));
    const randomIndex = Math.floor(this.random.next() * swappablePages.length);
    return swappablePages[randomIndex];
  }

  createProcess(pid: number): Process {
    const newProcess: Process = new Process(pid);
    return newProcess;
  }

  createPointer(frag: number): Pointer {
    this.pointerConsecutive++;
    const newPointer: Pointer = new Pointer(this.pointerConsecutive, frag);
    return newPointer;
  }

  cNewProcess(pid: number, size: number): Page[] {
    const process = this.getOrCreateProcess(pid);
    const pagesArr: Page[] = this.allocatePages(size);
    const newPointer = this.mapPagesToPointer(pagesArr);
    this.pointerPageMap.set(newPointer, pagesArr);
    process.addPointer(newPointer);
    this.processes.push(process);
    return this.pointerPageMap.get(newPointer)!;
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
      // if (remainingSpace < 4096) {
      //   this.trashing += remainingSpace;
      // }
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

  cUsePointer(pointerId: number): void {
    const pointer = this.getPointerById(pointerId);
    const pages = this.pointerPageMap.get(pointer!);
    if (!pages) {
      throw new Error('Pointer not found in the map');
    }``
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
        this.currentMemUsage += page.getmemoryUse() / 1024;
      }
      page.toggleRam();
      pagesOnRam.push(page);
      rndPages.push(page);
    });
    this.loadedPages.push(...rndPages);
    this.clock += pagesNotOnRam.length * 1;
    this.clock += pagesOnRam.length * 5;
    this.trashing += 5;
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


  cKillProcess(pid: number): void {
    const process = this.getProcessByID(pid);
    const pointers = process.getPointers();
    pointers.forEach((pointer) => {
      this.cDeleteProcess(pointer.getId());
    })
    this.processes = this.processes.filter((process) => process.id !== pid);
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
    const ptr = this.getPointerById(ptrId)!
    process.removePointer(ptr);
    this.pointerPageMap.delete(pointer);
  }

  freePage(page: Page): void {
    if (this.loadedPages.includes(page)) {
      this.currentMemUsage -= page.getmemoryUse() / 1024;
      const pageLoadedIndex = this.loadedPages.find((loadedPage) => loadedPage === page);
      this.loadedPages = this.loadedPages.filter((page) => page !== pageLoadedIndex);
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
    let toRemove: Page;
    toRemove = this.selectRandomPage(toIgnore);
    for (const [key, values] of this.pointerPageMap) {
      for (const value of values) {
        if (value === toRemove) {
          this.currentVirtualMemUsage += Math.round(value.getmemoryUse() / 1024);
          const segmentReturn: number = value.getSegmentDir()!;
          value.setSegmentDir(undefined);
          value.toggleRam();
          this.recalculateFragmentation(key);
          this.loadedPages = this.loadedPages.filter((page) => page.getId() !== value.getId());
          return segmentReturn;
        }
      }
    }
    throw new Error('Paging not in the map, is not posible make the swap');
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
      if (page.getmemoryUse() != 4096) {
        fragmentation += page.getmemoryUse();
      }
    });
    return fragmentation;
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
    console.log(this.loadedPages);
  }

  getLoadedPages(): Page[] {
    return this.loadedPages;
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
