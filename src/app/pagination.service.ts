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

  constructor() {
    this.testReadFile();

  }

  rndLoaded: any [] = [];

  public getMRU(): void {
    const RNDP = new RND('seed');
    for(let i=0;i<100;i++){
      RNDP.cNewProcess(i, 4096);
      RNDP.getClock();
      RNDP.getTrashing();
      RNDP.getCurrentMemUsage();
    }
  }

  public getFIFO(): void {
    const FIFO = new Fifo();
  }

  public getRND(): Page[] {
    const RNDP = new RND('seed');
    let logs: any[] = [];
    for(let i=0;i<100;i++){
      logs[i] = RNDP.cNewProcess(i, 4096);
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
  public testReadFile(): void {
    const fileContent = `new(1,1000)\nnew(2,11000)\nnew(3,8000)\nnew(3,10000)\nuse(1)\nuse(2)\nuse(3)`;
    const simulatedFile = new File([fileContent], 'simulatedFile.txt', { type: 'text/plain' });

    this.processLines(simulatedFile,1);
  }
  public getPaginAlgorithm(idPaging:number):Fifo|SecondChance|MRU|RND|undefined{
    if(idPaging===1){
      return new Fifo();
    }else if(idPaging===2){
      return new SecondChance();
    }else if(idPaging===3){
      return new MRU();
    }else if(idPaging===4){
      return new RND();
    }
    return undefined;
  }

  public processLines(file: File,idPaging:number): void {
    type ValueTuple = [number, string[]];
    const reader = new FileReader();
    let usesStack:number[] = [];
    let instructionsMap:ValueTuple[]=[];
    let paginAlgorithm = this.getPaginAlgorithm(idPaging);
    

    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      const lines = fileContent.split(/\r?\n/); // Divide el contenido en líneas
      // Expresiones regulares para cada tipo de instrucción
      const usePattern = /use\((\d+)\)/; 
      const newPattern = /new\((\d+),\s*(\d+)\)/; 
      const deletePattern = /delete\((\d+)\)/; 
      const killPattern = /kill\((\d+)\)/; 

      lines.forEach((line, index) => {
        if (line.length === 0) {
          return; // Ignorar líneas vacías
        }
   
        if (usePattern.test(line)) {
          const match = line.match(usePattern);
          const numberInsideParentheses = match![1]; 
    
          instructionsMap.push([1,[numberInsideParentheses]]);
          usesStack.push(Number(numberInsideParentheses));
        } else if (newPattern.test(line)) {
          const match = line.match(newPattern);
          const firstNumber = match![1]; 
          const secondNumber = match![2]; 
          instructionsMap.push([2,[firstNumber,secondNumber]]);
          
        } else if (deletePattern.test(line)) {
          const match = line.match(deletePattern);
          const numberInsideParentheses = match![1];
          instructionsMap.push([3,[numberInsideParentheses]]); 
         
        } else if (killPattern.test(line)) {
          const match = line.match(killPattern);
          const numberInsideParentheses = match![1]; 
          instructionsMap.push([4,[numberInsideParentheses]]); 
          
        }else{
           console.log(`Línea ${index + 1}: No se reconoce la instrucción.`);
        }
      });
      
      instructionsMap.forEach(([id, value]) => {
        if(paginAlgorithm!==undefined){
          if(id===1){
            paginAlgorithm.cUsePointer(Number(value[0]));
          }else if(id===2){
            paginAlgorithm.cNewProcess(Number(value[0]),Number(value[1]));
          }else if(id===3){
            paginAlgorithm.cDeleteProcess(Number(value[0]));
          }else if(id===4){
            paginAlgorithm.cKillProcess(Number(value[0]));
          }
        }
        
      });
      if(paginAlgorithm!==undefined){
        console.log(paginAlgorithm.printProcesses());
      }
      
    };
    
    

    reader.onerror = (e) => {
      console.error('Error al leer el archivo:', e);
    };

    reader.readAsText(file);
  }

  public generateInstructions(seed:string,idPaging:number): void {
    
    let paginAlgorithm=this.getPaginAlgorithm(idPaging);

    
  }
  

}
