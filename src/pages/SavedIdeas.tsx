import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function SavedIdeas() {
  const { user, loading: authLoading } = useAuth();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
        navigate('/');
        return;
    }

    if (user) {
      fetchSavedIdeas();
    }
  }, [user, authLoading, navigate]);

  async function fetchSavedIdeas() {
    try {
      const { data, error } = await supabase
        .from('saved_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error("Error fetching saved ideas:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta ideia?")) return;

    try {
      const { error } = await supabase.from('saved_ideas').delete().eq('id', id);
      if (error) throw error;
      setIdeas(ideas.filter(idea => idea.id !== id));
    } catch (error) {
      console.error("Error deleting idea:", error);
      alert("Erro ao remover ideia.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-12 flex items-center max-w-7xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Minhas Ideias Salvas</h1>
          <p className="text-secondary">Sua coleção pessoal de inspirações e adaptações.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.length === 0 ? (
          <div className="col-span-full text-center py-20 text-secondary">
            <p>Você ainda não salvou nenhuma ideia.</p>
            <Link to="/">
                <Button variant="link" className="mt-2">Explorar tendências</Button>
            </Link>
          </div>
        ) : (
          ideas.map(idea => (
            <Card key={idea.id} className="flex flex-col h-full hover:border-accent/50 transition-colors">
               <div className="h-48 relative overflow-hidden rounded-t-lg bg-surface">
                  {idea.product_data?.thumbnail?.url && (
                    <img src={idea.product_data.thumbnail.url} alt={idea.product_name} className="w-full h-full object-cover" />
                  )}
              </div>
              <CardHeader>
                <CardTitle>{idea.product_name}</CardTitle>
                <CardDescription className="line-clamp-2">{idea.product_data?.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                 <div className="text-sm text-secondary line-clamp-3">
                    {idea.product_data?.description}
                 </div>
                 
                 {idea.notes && (
                    <div className="bg-surface/50 p-3 rounded-md border border-border">
                        <h4 className="font-semibold text-accent text-xs uppercase tracking-wider mb-2">Adaptação Salva</h4>
                        <div className="text-xs text-gray-300 whitespace-pre-wrap">
                            {idea.notes}
                        </div>
                    </div>
                 )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                 <a href={idea.product_data?.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" /> Ver Produto
                    </Button>
                 </a>
                 <Button variant="destructive" size="icon" onClick={() => handleDelete(idea.id)}>
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

