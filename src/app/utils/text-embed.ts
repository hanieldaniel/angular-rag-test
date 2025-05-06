import { pipeline } from "@huggingface/transformers";

const pipePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
export async function getVectorFromText(text: string) {
  const pipe = await pipePromise;
  const output = await pipe(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}
