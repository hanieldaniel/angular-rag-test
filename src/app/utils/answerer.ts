import { pipeline, QuestionAnsweringPipeline } from '@huggingface/transformers';

let answerer: QuestionAnsweringPipeline | null = null;

export const getAnswer = async (context: string, question: string) => {
  if (!!!answerer) {
    // @ts-ignore
    answerer = await pipeline(
      'question-answering',
      'Xenova/distilbert-base-uncased-distilled-squad'
    );
  }

  const output = await answerer(question, context);

  console.log(output);
  return output;
};
