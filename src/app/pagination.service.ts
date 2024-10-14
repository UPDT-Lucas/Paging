import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { MRU } from './classes/MRU';
import { RND } from './classes/RND';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  constructor() {}

  public getMRU(): void {
    const RNDP = new MRU();
    for(let i=0;i<6;i++){
      const proc1 = RNDP.cNewProcess(i, 4096);
    }
    const proc0 = RNDP.cNewProcess(6, 10000);
    RNDP.printPagesOnRam();
    RNDP.cUsePointer(1);
    const proc1 = RNDP.cNewProcess(7, 4096);
    RNDP.printPagesOnRam();
    //RNDP.printProcessPages();
    // RNDP.cUsePointer(4);
    // RNDP.printPagesOnRam();
    // RNDP.printProcessPages();
    // RNDP.cUsePointer(7);
    // RNDP.printPagesOnRam();
    // RNDP.cDeleteProcess(1);
    // RNDP.cDeleteProcess(2);
    // RNDP.printProcesses();
    // RNDP.cKillProcess(2);
    // RNDP.printProcesses();
    // RNDP.cNewProcess(7, 4096);
    // RNDP.cNewProcess(8, 10000);
    // console.log("en ram")
    // RNDP.printPagesOnRam();
    // console.log("en ram")
    // RNDP.printProcesses();
    // console.log(RNDP.getClock());
    // console.log(RNDP.getTrashing());
    // console.log(RNDP.getCurrentMemUsage());
  }
}
