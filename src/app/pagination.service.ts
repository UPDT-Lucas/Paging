import { Injectable } from '@angular/core';
import { Fifo } from './classes/Fifo';
import { MRU } from './classes/MRU';
import { RND } from './classes/RND';
import { Page } from './classes/Page';
import { Pointer } from './classes/Pointer';
import { SecondChance } from './classes/SecondChance';
import { cloneDeep } from 'lodash';

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

  constructor() {
    
    type ProcesoTupla = [number, Pointer, Page[]];
  }


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
   public getVirtualMemUsg(): number[] {
    return this.virtualMemUsg;
  }

  public getMemUsg(): number[] {
    return this.memUsg;
  }

  public getClock(): number[] {
    return this.clock;
  }
   
  public testReadFile(): void {
    const fileContent = `new(1,405504)\nnew(1,3000)\nuse(1)\nnew(1,3000)`;
    const simulatedFile = new File([fileContent], 'simulatedFile.txt', { type: 'text/plain' });

    this.generateInstructions("123",1,10,250);
  }
  public getPaginAlgorithm(idPaging:number,seed:string):Fifo|SecondChance|MRU|RND|undefined{
    if(idPaging===1){
      return new Fifo();
    }else if(idPaging===2){
      return new SecondChance();
    }else if(idPaging===3){
      return new MRU();
    }else if(idPaging===4){
      return new RND(seed);
    }
    return undefined;
  }

  public processLines(file: File,idPaging:number,seed:string): void {
    type ValueTuple = [number, string[]];
    type ProcesoTupla = [number, Pointer, Page[]];
    const reader = new FileReader();
    let usesStack:number[] = [];
    let instructionsMap:ValueTuple[]=[];
    let paginAlgorithm = this.getPaginAlgorithm(idPaging,seed);


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
      let indexlog =0;
      let indexcLoaded=0;
      let logs: ProcesoTupla[][] = [];
      instructionsMap.forEach(([id, value]) => {
    if (paginAlgorithm !== undefined) {
        // Usar una variable local para capturar el resultado
        let resultado;

        resultado = this.generateData(id,value,paginAlgorithm)
        const deepCopiedResult = cloneDeep(resultado);
          logs.push(deepCopiedResult!);

        // Guardar el estado actual después de la operación
        this.rndLoaded.push(cloneDeep(paginAlgorithm.getLoadedPages()));
    }
   });

      if(paginAlgorithm!==undefined){
        console.log(paginAlgorithm.printProcesses());
        console.log(logs);
        console.log(this.rndLoaded);

      }

    };



    reader.onerror = (e) => {
      console.error('Error al leer el archivo:', e);
    };

    reader.readAsText(file);
  }
 public getKeyByIndex(map: Map<number, number[]>, index: number): number | undefined {
    const keysArray = Array.from(map.keys());
    return index >= 0 && index < keysArray.length ? keysArray[index] : undefined;
}

public addValueToMap(map: Map<number, number[]>, key: number, value: number): void {
    if (map.has(key)) {
        map.get(key)?.push(value);
    } else {
        map.set(key, [value]);
    }
}

public removeValueFromMap(map: Map<number, number[]>, targetValue: number): void {
    for (const [key, valuesArray] of map.entries()) {
        const index = valuesArray.indexOf(targetValue);
        if (index !== -1) {
            valuesArray.splice(index, 1);
            map.set(key, valuesArray);
            break;
        }
    }
}

public generateInstructions(seed: string, idPaging: number, processes: number, instructions: number): void {
    type ValueTuple = [number, number[]];
    type ProcesoTupla = [number, Pointer, Page[]];
    let paginAlgorithm = this.getPaginAlgorithm(idPaging,seed);
    let instructionsMap: ValueTuple[] = [];
    const generator = new Rand(seed);
    let instructionsCounter = 0;
    let pointerList: number[] = [];
    let processesCreated: number[]=[];
    let processList: Map<number, number[]> = new Map<number, number[]>();
    let pointerFuture: number[] = [];
    let pointerCounter = 1;

    for (let i = 0; i < processes; i++) {
        processList.set(i, []);
    }

    while (instructionsCounter < instructions) {
        let instructionNumber = Math.floor(generator.next() * 100);
        let pID: number;
        let value: number;

        if (instructionNumber < 1 && processesCreated.length !== 0) { // 5% de probabilidad
             let keyToDelete: number | undefined;
                
                // Generar un ID aleatorio y validar que tenga elementos en su lista
                do {
                    pID = Math.floor(generator.next() * processList.size);
                    keyToDelete = this.getKeyByIndex(processList, pID);
                } while (keyToDelete === undefined || (processList.get(keyToDelete)?.length === 0));

                // Una vez que tenemos un keyToDelete válido
                if (keyToDelete !== undefined) {
                    instructionsMap.push([4, [keyToDelete]]);
                    
                    for (const point of processList.get(keyToDelete) || []) {
                        pointerList = pointerList.filter(num => num !== point);
                    }
                    processesCreated = processesCreated.filter(num => num !== keyToDelete);
                    processList.delete(keyToDelete);
                }

        } else if (instructionNumber < 3 && pointerList.length !== 0) { // 10% de probabilidad
            pID = Math.floor(generator.next() * pointerList.length);
            instructionsMap.push([3, [pointerList[pID]]]);
            this.removeValueFromMap(processList, pointerList[pID]);
            pointerList = pointerList.filter(num => num !== pointerList[pID]);

        } else if (instructionNumber < 50&& pointerList.length !== 0) { // 35% de probabilidad
            pID = Math.floor(generator.next() * pointerList.length);
            instructionsMap.push([1, [pointerList[pID]]]);
            // Reemplaza esto por la lógica apropiada para pointerFuture si es necesario
            pointerFuture.push(pointerList[pID]);

        } else { // 50% de probabilidad
            pID = Math.floor(generator.next() * processList.size);
            let keyToCreate = this.getKeyByIndex(processList, pID);
            if (keyToCreate !== undefined) {
                value = Math.floor(generator.next() * 12288);
                instructionsMap.push([2, [keyToCreate, value]]);
                this.addValueToMap(processList, keyToCreate, pointerCounter);
                pointerList.push(pointerCounter);
                // Reemplaza esto por la lógica apropiada para pointerFuture si es necesario
                pointerFuture.push(pointerCounter);
                processesCreated.push(keyToCreate);
                pointerCounter++;
            }
        }
        instructionsCounter++;
    }
    console.log(instructionsMap);
    let indexlog =0;
      let indexcLoaded=0;
      let logs: ProcesoTupla[][] = [];
      instructionsMap.forEach(([id, value]) => {
    if (paginAlgorithm !== undefined) {
        // Usar una variable local para capturar el resultado
        let resultado;

        resultado = this.generateDataNum(id,value,paginAlgorithm)
        const deepCopiedResult = cloneDeep(resultado);
          logs.push(deepCopiedResult!);

        // Guardar el estado actual después de la operación
        this.rndLoaded.push(cloneDeep(paginAlgorithm.getLoadedPages()));
    }
   });

      if(paginAlgorithm!==undefined){
        console.log(paginAlgorithm.printProcesses());
        console.log(logs);
        //console.log(this.rndLoaded);

      }
    
}


  public generateData(id:number,values:string[],paginAlgorithm :Fifo|SecondChance|
    MRU|RND){
        
        if (id === 1) {
            return paginAlgorithm.cUsePointer(Number(values[0]))!;
        } else if (id === 2) {
            return paginAlgorithm.cNewProcess(Number(values[0]), Number(values[1]))!;
        } else if (id === 3) {
            return  paginAlgorithm.cDeleteProcess(Number(values[0]))!;
        } else if (id === 4) {
            return paginAlgorithm.cKillProcess(Number(values[0]))!;
        }

        return undefined
  }
  public generateDataNum(id:number,values:number[],paginAlgorithm :Fifo|SecondChance|
    MRU|RND){
        
        if (id === 1) {
            console.log("Use( ",values[0]);
            return paginAlgorithm.cUsePointer(values[0])!;
        } else if (id === 2) {
            console.log("new( ",values[0],",",values[1]);
            return paginAlgorithm.cNewProcess(values[0], values[1])!;
        } else if (id === 3) {
            console.log("delete( ",values[0]);
            return  paginAlgorithm.cDeleteProcess(values[0])!;
        } else if (id === 4) {
            console.log("kill( ",values[0]);
            return paginAlgorithm.cKillProcess(values[0])!;
        }

        return undefined
  }


  

  public getSND(): void {
    const FIFO = new Fifo();
  }

}
