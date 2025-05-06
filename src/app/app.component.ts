import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DbService } from './services/db.service';
import { EmbedHelpService } from './services/embed-help.service';
import { FormsModule } from '@angular/forms';
import { euclideanDistance } from 'rxdb/plugins/vector';
import { sortByObjectNumberProperty } from 'rxdb/plugins/utils';
import { getAnswer } from './utils/answerer';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [FormsModule, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'angular-rag-test';
  embeddingWorker: Worker | null = null;
  question = '';
  answer: unknown;

  constructor(
    private dbService: DbService,
    private embedService: EmbedHelpService
  ) {}

  ngOnInit(): void {
    this.embedService.createVectorPipeline();
    this.embedService.importTextData();
  }

  async askQuestion() {
    const context = await this.embedService.getContextForResponse(
      this.question
    );
    this.answer = getAnswer(context, this.question);
  }
}
