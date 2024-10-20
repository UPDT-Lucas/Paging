import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { MRU } from './classes/MRU';
import { RND } from './classes/RND';
import { Page } from './classes/Page';
import { Pointer } from './classes/Pointer';
import { SecondChance } from './classes/SecondChance';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {

  rndLoaded: any [] = [];
  trashing: number [] = [];
  memUsg: number [] = [];
  clock: number [] = [];
  virtualMemUsg: number [] = [];

  private selectedFile: File | null = null;

  setFile(file: File | null) {
    this.selectedFile = file;
  }

  getFile(): File | null {
    return this.selectedFile;
  }

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

  public getRND(): Page[][]{
    const RNDP = new RND('seed');
    let logs: Page [][]= [];
    // for(let i=0;i<30;i++){
    //   logs.push(RNDP.cNewProcess(i, 10000));
    //   this.clock[i] =  RNDP.getClock();
    //   this.trashing[i] = RNDP.getTrashing();
    //   this.memUsg[i] =  RNDP.getCurrentMemUsage();
    //   this.rndLoaded[i] = RNDP.getLoadedPages();
    //   this.virtualMemUsg[i] = RNDP.getVirtualMemUsage();
    // }
    return logs;
  }

  public getLoadedRND(): Page[] {
    return this.rndLoaded;
  }

  public getTrashing(): number[] {
    return this.trashing;
  }

  public getMemUsg(): number[] {
    return this.memUsg;
  }

  public getClock(): number[] {
    return this.clock;
  }

  public getVirtualMemUsg(): number[] {
    return this.virtualMemUsg;
  }

  public getSND(): void {
    const FIFO = new Fifo();
  }

}
