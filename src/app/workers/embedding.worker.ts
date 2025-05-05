/// <reference lib="webworker" />

import {
  FeatureExtractionPipeline,
  mean,
  pipeline,
} from '@huggingface/transformers';

type Data = {
  text: string;
};

let extractor: FeatureExtractionPipeline | null = null;

addEventListener('message', async (event) => {
  const text = event.data;

  if (!extractor) {
    // @ts-ignore
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  // postMessage(response);
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  self.postMessage({
    status: 'complete',
    text: text,
    output: output.data,
  });
});
