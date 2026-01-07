import { GraphQLClient, gql } from 'graphql-request';

// Tipos simples para Vercel Functions
type VercelRequest = {
  method?: string;
  query: Record<string, string | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

const PH_API_ENDPOINT = 'https://api.producthunt.com/v2/api/graphql';

const GET_POSTS_QUERY = gql`
  query GetPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after, order: VOTES) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          thumbnail {
            url
          }
          website
          topics(first: 3) {
            edges {
              node {
                name
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Developer Token do Product Hunt (não expira, vinculado à sua conta)
    // Obtenha em: https://www.producthunt.com/v2/oauth/applications
    const developerToken = process.env.PRODUCT_HUNT_DEVELOPER_TOKEN || process.env.VITE_PRODUCT_HUNT_TOKEN;

    if (!developerToken) {
      return res.status(500).json({ 
        error: 'Product Hunt Developer Token não configurado.',
        hint: 'Configure PRODUCT_HUNT_DEVELOPER_TOKEN nas variáveis de ambiente. Obtenha seu token em: https://www.producthunt.com/v2/oauth/applications'
      });
    }

    const client = new GraphQLClient(PH_API_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${developerToken}`,
      },
    });

    const first = parseInt(req.query.first as string) || 20;
    const after = req.query.after as string | undefined;

    const data = await client.request(GET_POSTS_QUERY, { first, after });

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Product Hunt API Error:', error);
    
    // Retornar erro mais detalhado para debug
    return res.status(error.response?.status || 500).json({
      error: 'Erro ao buscar posts do Product Hunt',
      message: error.message,
      details: error.response?.errors || error.message,
    });
  }
}

