import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  constructor() {
    this.getFifo();
  }

  public getFifo(): void {
    const FifoP = new Fifo();
    const proc0 = FifoP.cNewProcess(0, 10);
    const proc1 = FifoP.cNewProcess(1, 10);
    FifoP.printProcesses();
    console.log('ok?');
  }
}
