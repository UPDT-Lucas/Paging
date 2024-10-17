import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { MRU } from './classes/MRU';
import { RND } from './classes/RND';
import Rand from 'rand-seed';
import { Page } from './classes/Page';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {

  rndLoaded: any [] = [];

  public getMRU(): void {
    const RNDP = new RND('seed');
    for(let i=1;i<100;i++){
      RNDP.cNewProcess(i, 4096);
      RNDP.getClock();
      RNDP.getTrashing();
      RNDP.getCurrentMemUsage();
    }
  }

  public getFIFO(): void {
    const FIFO = new Fifo();
  }

  public getRND(): Map<number, Page[]> [] {
    const RNDP = new RND('seed');
    let logs: Map<number, Page[]> [] = [];
    for(let i=0;i<100;i++){
      logs[i] = RNDP.cNewProcess(i, 4096)!;
      console.log(logs[i]);
      RNDP.getClock();
      RNDP.getTrashing();
      RNDP.getCurrentMemUsage();
      this.rndLoaded[i] = RNDP.getLoadedPages();
    }
    return logs;
  }

  public getLoadedRND(): Page[] {
    return this.rndLoaded;
  }

  public getSND(): void {
    const FIFO = new Fifo();
  }
}
