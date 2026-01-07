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

// Chama nossa API route serverless que faz a autenticação OAuth
export const getTrendingPosts = async (first: number = 20, after?: string) => {
  const params = new URLSearchParams();
  params.set('first', first.toString());
  if (after) {
    params.set('after', after);
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

