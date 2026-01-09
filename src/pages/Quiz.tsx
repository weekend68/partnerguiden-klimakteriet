import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export default function Quiz() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markQuizCompleted, overallProgress, totalArticles, articlesRead, quizzesCompleted } = useProgress();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loadingArticle, setLoadingArticle] = useState(true);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Fetch article from database
  useEffect(() => {
    const fetchArticle = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, content")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setAllArticles(data);
        const currentArticle = data.find(a => a.slug === slug);
        setArticle(currentArticle || null);
      }
      setLoadingArticle(false);
    };

    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (!article || loadingArticle) return;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current user session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError("Du måste vara inloggad för att ta quiz");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              articleTitle: article.title,
              articleContent: article.content,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            setError("Din session har gått ut. Ladda om sidan och logga in igen.");
            return;
          }
          throw new Error(data.error || "Kunde inte generera quiz");
        }

        const data = await response.json();
        setQuestions(data.questions);
      } catch (err) {
        console.error("Quiz error:", err);
        setError(err instanceof Error ? err.message : "Något gick fel");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [article, loadingArticle]);

  // Save quiz result when complete (only if passed with at least 3/5)
  useEffect(() => {
    if (quizComplete && user && article && score >= 3) {
      markQuizCompleted(article.id, score);
    }
  }, [quizComplete, user, article, score, markQuizCompleted]);

  if (loadingArticle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-foreground mb-4">Artikeln hittades inte</h1>
          <Button onClick={() => navigate("/artiklar")} variant="outline">
            Tillbaka till artiklarna
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = parseInt(selectedAnswer) === questions[currentQuestion].correctIndex;
    if (isCorrect) {
      setScore(score + 1);
    }
    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
      // Scroll to top for mobile users
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setQuizComplete(true);
    }
  };

  const currentArticleIndex = allArticles.findIndex((a) => a.slug === slug);
  const nextArticle = allArticles[currentArticleIndex + 1];
  const passed = score >= 3;
  const isAllComplete = passed && articlesRead === totalArticles && quizzesCompleted + 1 === totalArticles;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Link
            to={`/artikel/${slug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till artikeln
          </Link>

          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-body">Genererar quiz baserat på artikeln...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Link
            to={`/artikel/${slug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till artikeln
          </Link>

          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-heading text-foreground mb-2">Något gick fel</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Försök igen</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              {passed ? (
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
              ) : (
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
              )}
              <h2 className="text-2xl font-heading text-foreground mb-4">
                {passed ? "Quiz godkänt!" : "Inte godkänt"}
              </h2>
              <p className="text-4xl font-heading text-primary mb-2">
                {score} / {questions.length}
              </p>
              <p className="text-muted-foreground mb-8">
                {passed
                  ? percentage >= 80
                    ? "Fantastiskt! Du har verkligen förstått innehållet."
                    : "Bra jobbat! Du klarade gränsen på 3 rätt."
                  : "Du behöver minst 3 rätt för att klara quizet. Läs artikeln igen och försök på nytt!"}
              </p>

              {user && passed && (
                <p className="text-sm text-muted-foreground mb-6">
                  Din framsteg: {overallProgress}% av kursen avklarad
                </p>
              )}

              {!user && (
                <Link to="/auth" className="text-sm text-primary hover:underline mb-6 block">
                  Logga in för att spara dina framsteg
                </Link>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!passed ? (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/artikel/${slug}`)}>
                      Läs artikeln igen
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Försök igen
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Till startsidan
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/artikel/${slug}`)}>
                      Läs artikeln igen
                    </Button>
                    {isAllComplete ? (
                      <Button onClick={() => navigate("/grattis")}>
                        Se ditt resultat
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : nextArticle ? (
                      <Button onClick={() => navigate(`/artikel/${nextArticle.slug}`)}>
                        Nästa artikel
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={() => navigate("/artiklar")}>
                        Alla artiklar
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Link
          to={`/artikel/${slug}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till artikeln
        </Link>

        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            Fråga {currentQuestion + 1} av {questions.length}
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <h2 className="text-xl font-heading text-foreground mb-6">{question.question}</h2>

            <RadioGroup
              value={selectedAnswer ?? ""}
              onValueChange={setSelectedAnswer}
              disabled={hasAnswered}
              className="space-y-3"
            >
              {question.options.map((option, index) => {
                const isCorrect = index === question.correctIndex;
                const isSelected = parseInt(selectedAnswer ?? "-1") === index;

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                      hasAnswered
                        ? isCorrect
                          ? "bg-success/10 border-success"
                          : isSelected
                          ? "bg-destructive/10 border-destructive"
                          : "bg-muted/50 border-border"
                        : selectedAnswer === String(index)
                        ? "bg-accent border-primary"
                        : "bg-muted/30 border-border hover:bg-accent/50"
                    }`}
                  >
                    <RadioGroupItem value={String(index)} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer font-body text-foreground"
                    >
                      {option}
                    </Label>
                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>

            {hasAnswered && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-body">{question.explanation}</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              {!hasAnswered ? (
                <Button onClick={handleAnswer} disabled={selectedAnswer === null}>
                  Svara
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {currentQuestion < questions.length - 1 ? "Nästa fråga" : "Se resultat"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
