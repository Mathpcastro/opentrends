# OpenTrends 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)

Uma aplicação open-source minimalista e estilosa que conecta você às maiores tendências de SaaS do mundo através da API do Product Hunt. Explore produtos, receba sugestões de adaptação para o mercado brasileiro geradas por IA e salve suas ideias favoritas.

## ✨ Funcionalidades

- **🔥 Trending Products**: Visualize os produtos mais votados do Product Hunt em tempo real.
- **🇧🇷 Adaptação Brasil**: Receba sugestões estratégicas de como adaptar cada SaaS para o Brasil (Powered by OpenAI).
- **💾 Salvar Ideias**: Autenticação simples para salvar e gerenciar seus produtos favoritos.
- **🎨 UI Minimalista**: Interface dark mode moderna, focada no conteúdo.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Estilização**: Tailwind CSS, Lucide React (Ícones)
- **Backend/Auth**: Supabase
- **APIs**: Product Hunt GraphQL API, OpenAI API

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js (v18 ou superior)
- Conta no [Supabase](https://supabase.com/)
- Conta no [Product Hunt](https://www.producthunt.com/) (Developer Token)
- Conta na [OpenAI](https://openai.com/)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/opentrends.git
cd opentrends
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   Renomeie o arquivo `.env.example` para `.env` e preencha com suas chaves:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
VITE_PRODUCT_HUNT_TOKEN=seu_token_product_hunt
VITE_OPENAI_API_KEY=sua_chave_openai
```

4. Execute o projeto:
```bash
npm run dev
```

## 🌍 Deploy na Vercel

O projeto está pronto para deploy na Vercel. Siga os passos:

1. Faça um fork deste repositório no GitHub.
2. Crie um novo projeto na [Vercel](https://vercel.com) importando seu repositório.
3. Nas configurações do projeto na Vercel, vá em **Environment Variables** e adicione as mesmas variáveis do seu arquivo `.env`.
4. **Importante**: Na API do Product Hunt, adicione a URL de produção da Vercel (ex: `https://seu-projeto.vercel.app`) no campo **Redirect URI** da sua aplicação.

## 🤝 Como Contribuir

Contribuições são sempre bem-vindas! Siga os passos:

1. Faça um Fork do projeto.
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`).
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`).
4. Push para a Branch (`git push origin feature/MinhaFeature`).
5. Abra um Pull Request.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
