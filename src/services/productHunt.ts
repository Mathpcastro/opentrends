import { GraphQLClient, gql } from 'graphql-request';

const PH_API_ENDPOINT = 'https://api.producthunt.com/v2/api/graphql';
const PH_TOKEN = import.meta.env.VITE_PRODUCT_HUNT_TOKEN;

const client = new GraphQLClient(PH_API_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${PH_TOKEN}`,
  },
});

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

export const GET_POSTS_QUERY = gql`
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

export const getTrendingPosts = async (first: number = 20, after?: string) => {
  return client.request<any>(GET_POSTS_QUERY, { first, after });
};

