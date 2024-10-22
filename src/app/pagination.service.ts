import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { MRU } from './classes/MRU';
import { RND } from './classes/RND';
import { Page } from './classes/Page';
import { Pointer } from './classes/Pointer';
import { SecondChance } from './classes/SecondChance';
import { cloneDeep } from 'lodash';
import Rand from 'rand-seed';

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

  constructor() {}


  setFile(file: File | null) {
    this.selectedFile = file;
  }

  getFile(): File | null {
    return this.selectedFile;
  }

  public getLoadedRND(): Page[] {
    return this.rndLoaded;
  }

  public getTrashing(): number[] {
    return this.trashing;
  }
   public getVirtualMemUsg(): number[] {
    return this.virtualMemUsg;
  }

  public getMemUsg(): number[] {
    return this.memUsg;
  }

  public getClock(): number[] {
    return this.clock;
  }
}
