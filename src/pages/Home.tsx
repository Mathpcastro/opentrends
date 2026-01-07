import { useState, useEffect } from 'react';
import { getTrendingPosts, ProductHuntPost } from '../services/productHunt';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { generateBrazilAdaptation } from '../services/openai';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Bookmark, ExternalLink, Zap } from 'lucide-react';
import { Input } from '../components/ui/input';

import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState<ProductHuntPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [adaptingId, setAdaptingId] = useState<string | null>(null);
  const [adaptations, setAdaptations] = useState<Record<string, string>>({});
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false); // Simple toggle for now

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await getTrendingPosts();
        setPosts(data.posts.edges.map((edge: any) => edge.node));
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);
  
  // ... (handlers remain same)

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

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
          </div>
        ) : (
          posts.map(post => (
            <Card key={post.id} className="flex flex-col h-full hover:border-accent/50 transition-colors">
              <div className="h-48 relative overflow-hidden rounded-t-lg bg-surface">
                {post.thumbnail?.url && (
                  <img src={post.thumbnail.url} alt={post.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white">
                  ▲ {post.votesCount}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{post.name}</span>
                </CardTitle>
                <CardDescription className="line-clamp-2">{post.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-secondary mb-4 line-clamp-3">{post.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.topics.edges.map(({ node }: any) => (
                    <span key={node.name} className="px-2 py-1 bg-surface border border-border rounded text-xs text-secondary">
                      {node.name}
                    </span>
                  ))}
                </div>

                {adaptations[post.id] && (
                  <div className="bg-surface/50 p-3 rounded-md border border-border mt-4 text-sm text-gray-300">
                    <h4 className="font-semibold text-accent mb-1 flex items-center gap-2">
                      <Zap size={14} /> Adaptação Brasil
                    </h4>
                    <div className="whitespace-pre-wrap text-xs leading-relaxed">
                      {adaptations[post.id]}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t border-border pt-4">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="flex-1"
                   onClick={() => handleAdaptation(post)}
                   disabled={!!adaptations[post.id] || adaptingId === post.id}
                 >
                   {adaptingId === post.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                   {adaptations[post.id] ? "Gerado" : "Adaptar BR"}
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
    </div>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp } = useAuth();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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

