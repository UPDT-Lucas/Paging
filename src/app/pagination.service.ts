import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { MRU } from './classes/MRU';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  constructor() {}

  public getMRU(): void {
    const MRUP = new MRU();
    const proc0 = MRUP.cNewProcess(0, 4096);
    const proc1 = MRUP.cNewProcess(0, 4096);
    const proc2 = MRUP.cNewProcess(0, 4096);
    const proc3 = MRUP.cNewProcess(0, 4096);
    const proc4 = MRUP.cNewProcess(0, 4096);
    const proc5 = MRUP.cNewProcess(0, 4096);
    const proc6 = MRUP.cNewProcess(0, 4096);

    MRUP.cUsePointer(4);
    MRUP.printRecentlyUsed();
    MRUP.printProcessPages();
  }
}
