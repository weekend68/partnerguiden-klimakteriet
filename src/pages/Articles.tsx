import { Link } from "react-router-dom";
import { articles } from "@/data/articles";
import { ArrowLeft } from "lucide-react";

const Articles = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-xl font-semibold text-foreground">
            Relateify
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka till start
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl font-medium mb-4">
          Alla 13 artiklar
        </h1>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Läs artiklarna i ordning eller hoppa direkt till det ämne som känns mest relevant just nu.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              to={`/artikel/${article.slug}`}
              className="group bg-card rounded-lg shadow-card overflow-hidden card-hover"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src={article.imageUrl} 
                  alt={article.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="text-sm text-muted-foreground mb-2">
                  Artikel {index + 1} av 13
                </div>
                <h2 className="font-serif text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Articles;
