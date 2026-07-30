import axios from 'axios';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  answer?: string;
}

/**
 * Search the web using the Tavily API.
 * Tavily is purpose-built for AI agents — returns clean, structured results.
 * Get a free key at https://tavily.com
 */
export const webSearch = async (query: string): Promise<SearchResult[]> => {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured. Get a free key at https://tavily.com');
  }

  const response = await axios.post<TavilyResponse>(
    'https://api.tavily.com/search',
    {
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
    },
    { timeout: 15000 }
  );

  return response.data.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content.substring(0, 400),
    score: r.score,
  }));
};
