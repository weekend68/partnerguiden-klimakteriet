import { useParams, Link, useNavigate } from "react-router-dom";
import { getArticleBySlug, articles } from "@/data/articles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-4">Artikeln hittades inte</h1>
          <Button asChild>
            <Link to="/artiklar">Se alla artiklar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = articles.findIndex(a => a.id === article.id);
  const nextArticle = articles[currentIndex + 1];
  const prevArticle = articles[currentIndex - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-xl font-semibold text-foreground">
            Relateify
          </Link>
          <Link to="/artiklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Alla artiklar
          </Link>
        </div>
      </header>

      {/* Article Header Image */}
      <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden">
        <img 
          src={article.imageUrl} 
          alt={article.imageAlt}
          className="w-full h-full object-cover"
        />
      </div>

      <main className="container max-w-3xl py-12">
        <Link to="/artiklar" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Alla artiklar
        </Link>

        <div className="text-sm text-muted-foreground mb-4">
          Artikel {currentIndex + 1} av 13
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-medium mb-6 text-balance">
          {article.title}
        </h1>

        {/* Article Content */}
        <article className="prose-relateify text-lg leading-relaxed">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="font-serif text-2xl font-semibold mt-10 mb-4 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-serif text-xl font-medium mt-8 mb-3 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-5 text-foreground/90">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="my-5 pl-6 space-y-2 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-5 pl-6 space-y-2 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground/90">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/30 pl-5 my-6 italic text-muted-foreground">{children}</blockquote>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
              ),
              hr: () => <hr className="my-8 border-border" />,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>

        {/* Quiz CTA */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium mb-2">Testa din förståelse</h3>
              <p className="text-muted-foreground mb-4">
                Ta ett kort quiz med 5 frågor baserat på artikeln du just läst.
              </p>
              <Button onClick={() => navigate(`/quiz/${article.slug}`)}>
                Ta quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between">
          {prevArticle ? (
            <Link
              to={`/artikel/${prevArticle.slug}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Föregående: {prevArticle.title}</span>
            </Link>
          ) : <div />}
          {nextArticle && (
            <Link
              to={`/artikel/${nextArticle.slug}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors sm:text-right"
            >
              <span className="text-sm">Nästa: {nextArticle.title}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default Article;
