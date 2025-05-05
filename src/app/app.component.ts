import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'angular-rag-test';
  embeddingWorker: Worker | null = null;

  ngOnInit(): void {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.embeddingWorker = new Worker(
        new URL('./workers/embedding.worker', import.meta.url)
      );

      this.embeddingWorker.onmessage = (event) => {
        console.log(event.data);
      };

      this.embeddingWorker.postMessage({ data: 'hello how are you madam' });
    } else {
      console.log('not supported');
    }
  }
}
