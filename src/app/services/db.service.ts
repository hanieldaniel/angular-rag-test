import { Injectable } from '@angular/core';
import { addRxPlugin, createRxDatabase, RxDatabase } from 'rxdb';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';
import { wrappedValidateIsMyJsonValidStorage } from 'rxdb/plugins/validate-is-my-json-valid';


@Injectable({
  providedIn: 'root'
})
export class DbService {

  db: RxDatabase | null = null;

  constructor() {
    this.initalizeDB();
  }


  async initalizeDB() {

    if (true) {
      await import('rxdb/plugins/dev-mode').then(
        module => addRxPlugin(module.RxDBDevModePlugin)
      );
    }

    const storage = wrappedValidateIsMyJsonValidStorage({
      storage: getRxStorageLocalstorage()
    });

    this.db = await createRxDatabase({
      name: 'mydatabase',
      storage
    });

    await this.db.addCollections({
      items: {
        schema: {
          version: 0,
          primaryKey: 'id',
          type: 'object',
          properties: {
            id: {
              type: 'string',
              maxLength: 20
            },
            text: {
              type: 'string'
            }
          },
          required: ['id', 'text']
        }
      }
    });

    await this.db.addCollections({
      vector: {
        schema: {
          version: 0,
          primaryKey: 'id',
          type: 'object',
          properties: {
            id: {
              type: 'string',
              maxLength: 20
            },
            embedding: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          },
          required: ['id', 'embedding']
        }
      }
    });
  }

  get itemsCollection() {
    return this.db?.['items']
  }

  get vectorCollection() {
    return this.db?.['vector']
  }

}
