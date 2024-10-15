import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { SecondChance } from './classes/SecondChance';


@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  constructor() {
    this.getFifo();
  }

  public getFifo(): void {
    const FifoP = new SecondChance();
    for(let i =0 ;i<100;i++){
      FifoP.cNewProcess(i, 4096);
    }

    FifoP.printProcesses();
    FifoP.cNewProcess(0, 1000);
    FifoP.cUseProcess(2);
    FifoP.cNewProcess(0, 1000);
    FifoP.cKillProcess(0);
    FifoP.cNewProcess(2, 1000);
    FifoP.cUseProcess(3);
    FifoP.cNewProcess(2, 1000);
    FifoP.cNewProcess(2, 1000);
    FifoP.cNewProcess(2, 1000);
    FifoP.cNewProcess(2, 1000);
    FifoP.cUseProcess(7);
    FifoP.cNewProcess(2, 1000);
    FifoP.cKillProcess(2);
    FifoP.cNewProcess(3, 1000);
    FifoP.cNewProcess(3, 1000);
    FifoP.cNewProcess(3, 1000);
    FifoP.cNewProcess(3, 1000);
    FifoP.cNewProcess(3, 1000);
    FifoP.cNewProcess(3, 1000);
    FifoP.cNewProcess(3, 1000);


 
    FifoP.printProcesses();


    


    
    //FifoP.printProcesses();

    console.log('ok?');
  }
}
