export interface ProductHuntPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votesCount: number;
  thumbnail: {
    url: string;
  };
  website: string;
  topics: {
    edges: {
      node: {
        name: string;
      };
    }[];
  };
}

export type PostsOrder = 'VOTES';

export interface GetTrendingPostsOptions {
  first?: number;
  after?: string;
  order?: PostsOrder;
}

// Chama nossa API route serverless (token fica no servidor)
export const getTrendingPosts = async (options: GetTrendingPostsOptions = {}) => {
  const { first = 20, after, order = 'VOTES' } = options;
  const params = new URLSearchParams();
  params.set('first', first.toString());
  if (after) {
    params.set('after', after);
  }
  if (order) {
    params.set('order', order);
  }

  // Em produção, usa a API route da Vercel. Em dev, pode usar localhost se rodar vercel dev
  const apiUrl = import.meta.env.PROD 
    ? '/api/producthunt' 
    : import.meta.env.VITE_API_URL || '/api/producthunt';

  const response = await fetch(`${apiUrl}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

