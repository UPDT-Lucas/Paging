import { Process } from '../classes/Process';

export interface IMMU {
  RAM: number;
  pageSize: number;
  currentMemUsage: number;
  clock: number;
  pageConsectuive: number;
  pointerConsectuive: number;
  processes: Process[];

  getProcessByID(): Process;
  getProcessByPointerId(): Process;
  createProcess(): void;
  createPointer(): void;
  cNewProcess(): void;
  cKillProcess(): void;
  cDeleteProcess(): void;
}
