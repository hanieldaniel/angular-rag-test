import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { forkJoin, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { files } from '../constants/help';




@Injectable({
  providedIn: 'root'
})
export class EmbedHelpService {

  lastWorkerId = 0;
  lastId = 0;
  workers = new Array(navigator.hardwareConcurrency)
    .fill(0)
    .map(() => new Worker(new URL("./../workers/embedding.worker", import.meta.url)));

  constructor(
    private dbService: DbService,
    private http: HttpClient
  ) { }

 
async getVectorFromTextWithWorker(text: string): Promise<number[]> {
  let worker = this.workers[this.lastWorkerId++];
  if (!worker) {
    this.lastWorkerId = 0;
    worker = this.workers[this.lastWorkerId++];
  }
  const id = (this.lastId++) + '';
  return new Promise<number[]>(res => {
    const listener = (ev: any) => {
      if (ev.data.id === id) {
        res(ev.data.embedding);
        worker.removeEventListener('message', listener);
      }
    };
    worker.addEventListener('message', listener);
    worker.postMessage({
      id,
      text
    });
  });
}

async importTextData(){

  const req = files.map(file => {
    return this.http.get(`/help-files/${file.name}`, { responseType: 'text' })
    .pipe(map(content => {
      return {
        id: file.id,
        text: content
        .replace(/#+\s+/g, '') 
        .replace(/\n{3,}/g, '\n\n') 
        .trim()
      }
    }));
  });

  forkJoin(req).subscribe({
    next: async (data) => {
      try{
        if(!!!this.dbService.itemsCollection){
          await this.dbService.initalizeDB();
        }

        // await this.dbService.itemsCollection?.bulkRemove();
        const insertResult = await this.dbService.itemsCollection?.bulkUpsert(data);
        if (insertResult) {
          console.log("inserted records");
        }
      }catch(error){
        console.error(error);
      }
    }
  })

}
}
