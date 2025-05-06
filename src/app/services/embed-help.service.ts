import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { forkJoin, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { files } from '../constants/help';
import { euclideanDistance } from 'rxdb/plugins/vector';
import { sortByObjectNumberProperty } from 'rxdb/plugins/utils';

@Injectable({
  providedIn: 'root',
})
export class EmbedHelpService {
  lastWorkerId = 0;
  lastId = 0;
  workers = new Array(navigator.hardwareConcurrency)
    .fill(0)
    .map(
      () =>
        new Worker(new URL('./../workers/embedding.worker', import.meta.url))
    );

  constructor(private dbService: DbService, private http: HttpClient) {}

  async getVectorFromTextWithWorker(text: string): Promise<number[]> {
    let worker = this.workers[this.lastWorkerId++];
    if (!worker) {
      this.lastWorkerId = 0;
      worker = this.workers[this.lastWorkerId++];
    }
    const id = this.lastId++ + '';
    return new Promise<number[]>((res) => {
      const listener = (ev: any) => {
        if (ev.data.id === id) {
          res(ev.data.embedding);
          worker.removeEventListener('message', listener);
        }
      };
      worker.addEventListener('message', listener);
      worker.postMessage({
        id,
        text,
      });
    });
  }

  async importTextData() {
    const req = files.map((file) => {
      return this.http
        .get(`/help-files/${file.name}`, { responseType: 'text' })
        .pipe(
          map((content) => {
            return {
              id: String(file.id),
              text: content
                .replace(/#+\s+/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim(),
            };
          })
        );
    });
    // await this.createVectorPipeline();
    forkJoin(req).subscribe({
      next: async (data) => {
        try {
          const insertResult = await this.dbService.itemsCollection?.bulkUpsert(
            data
          );
          console.log(insertResult);
          await this.createEmbeddings(data);
        } catch (error) {
          console.error(error);
        }
      },
    });
  }

  async createVectorPipeline() {
    await this.dbService.itemsCollection?.addPipeline({
      identifier: 'my-embeddings-pipeline',
      destination: this.dbService.vectorCollection!,
      batchSize: navigator.hardwareConcurrency, // one per CPU core
      handler: async (docs) => {
        await Promise.all(
          docs.map(async (doc) => {
            const embedding = await this.getVectorFromTextWithWorker(doc.text);
            await this.dbService.vectorCollection?.upsert({
              id: doc.primary,
              embedding,
            });
          })
        );
      },
    });
  }

  async createEmbeddings(data: { id: string; text: string }[]) {
    const insert = await Promise.all(
      data.map(async (item) => {
        const embedding = await this.getVectorFromTextWithWorker(item.text);
        const res = await this.dbService.vectorCollection?.upsert({
          id: item.id,
          embedding,
        });
      })
    );
  }

  async getContextForResponse(question: string) {
    const queryVector = await this.getVectorFromTextWithWorker(question);
    const candidates = await this.dbService.vectorCollection?.find().exec();
    const withDistance = candidates?.map((doc) => ({
      doc,
      distance: euclideanDistance(queryVector, doc.embedding),
    }));
    const queryResult = withDistance
      ?.sort(sortByObjectNumberProperty('distance'))
      .reverse()[0];

    const contextForResponse = await this.dbService.itemsCollection
      ?.findOne({
        selector: {
          id: queryResult?.doc.id,
        },
      })
      .exec();

    return contextForResponse.text;
  }
}
