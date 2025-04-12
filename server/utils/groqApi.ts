import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192'; // Using llama3 model

interface Message {
  role: string;
  content: string;
}

/**
 * Send a chat completion request to the GROQ API
 */
export async function groqChatCompletion(messages: Message[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response from GROQ API');
    }
  } catch (error) {
    console.error('Error calling GROQ API:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('GROQ API error details:', error.response.data);
      throw new Error(`GROQ API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error('Failed to get response from GROQ API');
  }
}
