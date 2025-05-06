/// <reference lib="webworker" />

import {getVectorFromText} from './../utils/text-embed'

onmessage = async (e) => {
  const embedding = await getVectorFromText(e.data.text);
  postMessage({
      id: e.data.id,
      embedding
  });
};
