import OpenAI from 'openai';
import { env } from '../config/env';
import { ChatMessage } from '../types';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export class OpenAIService {
  async chat(messages: ChatMessage[]): Promise<{ response: string; tokens: number }> {
    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';
      const tokens = completion.usage?.total_tokens || 0;

      return { response, tokens };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded');
      }
      
      if (error.status === 500) {
        throw new Error('OpenAI service unavailable');
      }

      throw new Error('Failed to generate AI response');
    }
  }

  async streamChat(messages: ChatMessage[]): Promise<AsyncIterable<string>> {
    try {
      const stream = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      async function* generateStream() {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        }
      }

      return generateStream();
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to stream AI response');
    }
  }
}

export default new OpenAIService();
