import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { getTrendingPosts, type ProductHuntPost, type PostsOrder } from '../services/productHunt';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { generateBrazilAdaptation, translateToPortuguese, type TranslatedContent } from '../services/openai';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Bookmark, ExternalLink, Zap, Languages, X, TrendingUp, BarChart3 } from 'lucide-react';
import { Input } from '../components/ui/input';
import ReactMarkdown from 'react-markdown';

import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState<ProductHuntPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [adaptingId, setAdaptingId] = useState<string | null>(null);
  const [adaptations, setAdaptations] = useState<Record<string, string>>({});
  const [translations, setTranslations] = useState<Record<string, TranslatedContent>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [adaptationModalOpen, setAdaptationModalOpen] = useState<string | null>(null); // ID do post com modal aberto
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false); // Simple toggle for now
  const [selectedFilter, setSelectedFilter] = useState<'most_voted' | 'vote_growth' | 'vote_velocity'>('most_voted');
  const [previousSnapshot, setPreviousSnapshot] = useState<{ timestamp: number; posts: ProductHuntPost[] } | null>(null);

  useEffect(() => {
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

    const getCacheKey = (filter: string) => `producthunt_posts_cache_${filter}`;
    const getPrevCacheKey = (filter: string) => `producthunt_posts_cache_prev_${filter}`;

    const loadSnapshot = (key: string) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.timestamp !== 'number' || !Array.isArray(parsed.posts)) return null;
        return parsed as { timestamp: number; posts: ProductHuntPost[] };
      } catch {
        return null;
      }
    };

    const saveSnapshot = (key: string, snapshot: { timestamp: number; posts: ProductHuntPost[] }) => {
      localStorage.setItem(key, JSON.stringify(snapshot));
    };

    async function fetchPostsForFilter(filter: typeof selectedFilter) {
      try {
        setLoading(true);

        const cacheKey = getCacheKey(filter);
        const prevKey = getPrevCacheKey(filter);

        const cached = loadSnapshot(cacheKey);
        const prev = loadSnapshot(prevKey);

        // Se passou menos de 24 horas, usa o cache
        if (cached) {
          const now = Date.now();
          const timeDiff = now - cached.timestamp;
          if (timeDiff < CACHE_DURATION) {
            setPosts(cached.posts);
            setPreviousSnapshot(prev);
            setLastUpdatedAt(cached.timestamp);
            setError(null);
            return;
          }
        }

        // Se não há cache válido, busca novos posts
        const order: PostsOrder = 'VOTES';
        const data = await getTrendingPosts({ order });
        const postsData = data.posts.edges.map((edge: any) => edge.node);

        const nowTs = Date.now();
        const nextSnapshot = { timestamp: nowTs, posts: postsData };

        // Mantém snapshot anterior para calcular crescimento
        if (cached) {
          saveSnapshot(prevKey, cached);
          setPreviousSnapshot(cached);
        } else {
          setPreviousSnapshot(prev);
        }

        saveSnapshot(cacheKey, nextSnapshot);
        setLastUpdatedAt(nowTs);
        setPosts(postsData);
        setError(null);
      } catch (error: any) {
        console.error("Failed to fetch posts", error);

        // Em caso de erro, tenta usar cache mesmo que expirado
        const cacheKey = getCacheKey(filter);
        const prevKey = getPrevCacheKey(filter);
        const cached = loadSnapshot(cacheKey);
        const prev = loadSnapshot(prevKey);

        if (cached) {
          setPosts(cached.posts);
          setPreviousSnapshot(prev);
          setLastUpdatedAt(cached.timestamp);
          setError("Usando dados em cache. Erro ao buscar novas tendências.");
        } else {
          setError("Erro ao carregar tendências. Verifique se o Developer Token do Product Hunt está configurado corretamente.");
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchPostsForFilter(selectedFilter);
  }, [selectedFilter]);

  const derived = useMemo(() => {
    const prevPosts = previousSnapshot?.posts || [];
    const prevTs = previousSnapshot?.timestamp ?? null;
    const curTs = lastUpdatedAt ?? null;

    const prevVotesById = new Map<string, number>();
    for (const p of prevPosts) {
      prevVotesById.set(p.id, p.votesCount);
    }

    const hours = prevTs && curTs ? Math.max((curTs - prevTs) / 3600000, 0.01) : null;

    const enriched = posts.map((p) => {
      const prevVotes = prevVotesById.get(p.id);
      const deltaVotes = typeof prevVotes === 'number' ? p.votesCount - prevVotes : 0;
      const votesPerHour = hours ? deltaVotes / hours : 0;

      return { post: p, deltaVotes, votesPerHour, hasHistory: !!hours };
    });

    const sorted = [...enriched];
    if (selectedFilter === 'most_voted') {
      sorted.sort((a, b) => b.post.votesCount - a.post.votesCount);
    } else if (selectedFilter === 'vote_growth') {
      sorted.sort((a, b) => (b.deltaVotes - a.deltaVotes) || (b.post.votesCount - a.post.votesCount));
    } else {
      sorted.sort((a, b) => (b.votesPerHour - a.votesPerHour) || (b.deltaVotes - a.deltaVotes) || (b.post.votesCount - a.post.votesCount));
    }

    return { items: sorted, hasHistory: !!hours, hours: hours ?? 0 };
  }, [posts, previousSnapshot, lastUpdatedAt, selectedFilter]);
  
  const handleAdaptation = async (post: ProductHuntPost) => {
    try {
      setAdaptingId(post.id);
      const adaptation = await generateBrazilAdaptation(post.name, post.description);
      setAdaptations(prev => ({ ...prev, [post.id]: adaptation }));
    } catch (error) {
      console.error("Failed to generate adaptation", error);
      alert("Erro ao gerar adaptação. Tente novamente.");
    } finally {
      setAdaptingId(null);
    }
  };

  const handleTranslate = async (post: ProductHuntPost) => {
    if (translations[post.id]) return; // Já traduzido

    try {
      setTranslatingId(post.id);
      const translated = await translateToPortuguese(post.name, post.tagline, post.description);
      setTranslations(prev => ({ ...prev, [post.id]: translated }));
    } catch (error) {
      console.error("Failed to translate", error);
      alert("Erro ao traduzir. Tente novamente.");
    } finally {
      setTranslatingId(null);
    }
  };

  const handleSave = async (post: ProductHuntPost) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const { error } = await supabase.from('saved_ideas').insert({
        user_id: user.id,
        product_hunt_id: post.id, // ID do Product Hunt (obrigatório)
        product_name: post.name,
        product_data: post,
        notes: adaptations[post.id] ?? null,
      });

      if (error) throw error;
      alert("Ideia salva!");
    } catch (error) {
      console.error("Failed to save idea", error);
      alert("Erro ao salvar ideia. Verifique sua tabela no Supabase e tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-12 flex justify-between items-center max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">OpenTrends</h1>
          <p className="text-secondary text-lg">Descubra e adapte o próximo grande SaaS para o Brasil.</p>
        </div>
        <div className="flex items-center gap-4">
           {user ? (
             <>
                <Link to="/saved">
                    <Button variant="secondary">Minhas Ideias</Button>
                </Link>
                <Button variant="ghost" onClick={signOut}>Sair</Button>
             </>
           ) : (
             <Button variant="outline" onClick={() => setAuthModalOpen(true)}>Login</Button>
           )}
        </div>
      </header>

      <section className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedFilter === 'most_voted' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('most_voted')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Mais votados
          </Button>
          <Button
            variant={selectedFilter === 'vote_growth' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('vote_growth')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Maior crescimento de votos
          </Button>
          <Button
            variant={selectedFilter === 'vote_velocity' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('vote_velocity')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Mais crescendo (votos/h)
          </Button>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {lastUpdatedAt && (
            <p className="text-xs text-secondary">
              Atualizado em {new Date(lastUpdatedAt).toLocaleString('pt-BR')}
            </p>
          )}
          {selectedFilter !== 'most_voted' && !derived.hasHistory && (
            <p className="text-xs text-secondary">
              Sem histórico ainda para calcular crescimento. Volte amanhã para ver a variação desde a última coleta.
            </p>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : derived.items.length === 0 ? (
          <div className="col-span-full text-center py-20 text-secondary">
            <p>Nenhuma tendência encontrada.</p>
          </div>
        ) : (
          derived.items.map(({ post, deltaVotes, votesPerHour }) => (
            <Card key={post.id} className="flex flex-col h-full hover:border-accent/50 transition-colors">
              <div className="h-48 relative overflow-hidden rounded-t-lg bg-surface">
                {post.thumbnail?.url && (
                  <img src={post.thumbnail.url} alt={post.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white">
                  ▲ {post.votesCount}
                </div>
                {selectedFilter === 'vote_growth' && derived.hasHistory && (
                  <div className="absolute top-2 left-2 bg-accent/20 border border-accent/30 backdrop-blur px-2 py-1 rounded text-xs text-accent">
                    +{Math.max(deltaVotes, 0)}
                  </div>
                )}
                {selectedFilter === 'vote_velocity' && derived.hasHistory && (
                  <div className="absolute top-2 left-2 bg-accent/20 border border-accent/30 backdrop-blur px-2 py-1 rounded text-xs text-accent">
                    +{Math.max(deltaVotes, 0)} ({Math.max(votesPerHour, 0).toFixed(1)}/h)
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{translations[post.id]?.name || post.name}</span>
                  {!translations[post.id] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleTranslate(post)}
                      disabled={translatingId === post.id}
                      title="Traduzir para português"
                    >
                      {translatingId === post.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Languages className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {translations[post.id]?.tagline || post.tagline}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-secondary mb-4 line-clamp-3">
                  {translations[post.id]?.description || post.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.topics.edges.map(({ node }: any) => (
                    <span key={node.name} className="px-2 py-1 bg-surface border border-border rounded text-xs text-secondary">
                      {node.name}
                    </span>
                  ))}
                </div>

              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t border-border pt-4">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="flex-1"
                   onClick={() => {
                     if (adaptations[post.id]) {
                       setAdaptationModalOpen(post.id);
                     } else {
                       handleAdaptation(post);
                     }
                   }}
                   disabled={adaptingId === post.id}
                 >
                   {adaptingId === post.id ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Gerando...
                     </>
                   ) : adaptations[post.id] ? (
                     <>
                       <Zap className="mr-2 h-4 w-4" />
                       Ver adaptação
                     </>
                   ) : (
                     <>
                       <Zap className="mr-2 h-4 w-4" />
                       Adaptar BR
                     </>
                   )}
                 </Button>
                 
                 <Button variant="secondary" size="icon" onClick={() => handleSave(post)}>
                   <Bookmark className="h-4 w-4" />
                 </Button>
                 
                 <a href={post.url} target="_blank" rel="noopener noreferrer">
                   <Button variant="outline" size="icon">
                     <ExternalLink className="h-4 w-4" />
                   </Button>
                 </a>
              </CardFooter>
            </Card>
          ))
        )}
      </main>
      
      {/* Auth Modal Quick Hack for MVP */}
      {authModalOpen && !user && (
         <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}

      {/* Adaptation Modal */}
      {adaptationModalOpen && adaptations[adaptationModalOpen] && (
        <AdaptationModal
          productName={posts.find(p => p.id === adaptationModalOpen)?.name || ''}
          adaptation={adaptations[adaptationModalOpen]}
          onClose={() => setAdaptationModalOpen(null)}
        />
      )}
    </div>
  );
}

function AdaptationModal({ 
  productName, 
  adaptation, 
  onClose 
}: { 
  productName: string; 
  adaptation: string; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-background border border-border rounded-lg shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-accent" />
            <div>
              <h2 className="text-2xl font-bold text-primary">Adaptação Brasil</h2>
              <p className="text-sm text-secondary">{productName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-primary mb-4 mt-6 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-primary mb-3 mt-5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-accent mb-2 mt-4">{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-semibold text-accent mb-2 mt-3">{children}</h4>,
                p: ({ children }) => <p className="text-secondary mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-4 ml-6 space-y-2 text-secondary">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-4 ml-6 space-y-2 text-secondary">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                em: ({ children }) => <em className="italic text-secondary">{children}</em>,
                code: ({ children }) => <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-accent font-mono">{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-accent pl-4 italic text-secondary my-4">{children}</blockquote>,
              }}
            >
              {adaptation}
            </ReactMarkdown>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp } = useAuth();
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    let res;
    if (isLogin) {
      res = await signIn(email, password);
    } else {
      res = await signUp(email, password);
    }
    
    if (res.error) {
      setError(res.error.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-background border border-border rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">{isLogin ? "Login" : "Criar Conta"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button type="submit" className="w-full">{isLogin ? "Entrar" : "Cadastrar"}</Button>
        </form>
        
        <p className="mt-4 text-center text-sm text-secondary cursor-pointer hover:underline" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Não tem conta? Crie uma." : "Já tem conta? Entre."}
        </p>
        <Button variant="ghost" className="w-full mt-2" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
}

