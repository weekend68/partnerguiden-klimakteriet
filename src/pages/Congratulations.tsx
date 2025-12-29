import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { Trophy, Share2, Twitter, Facebook, Linkedin, Copy, Check, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";

export default function Congratulations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { articlesRead, quizzesCompleted, totalArticles, overallProgress } = useProgress();
  const [copied, setCopied] = useState(false);

  const isComplete = articlesRead === totalArticles && quizzesCompleted === totalArticles;

  // Redirect if not complete
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (!isComplete && overallProgress < 100) {
      navigate("/artiklar");
    }
  }, [user, isComplete, overallProgress, navigate]);

  const shareText = "Jag har slutfört Partnerguiden om klimakteriet! 13 artiklar och quiz för att bättre förstå och stötta min partner. 💪❤️";
  const shareUrl = window.location.origin;

  const handleCopyLink = async () => {
    const textToCopy = `${shareText}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Länk kopierad!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  if (!user || !isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-lg sm:text-xl font-semibold text-foreground leading-tight">
            <span className="sm:hidden">Partnerguiden:<br />Klimakteriet</span>
            <span className="hidden sm:inline">Partnerguiden: Klimakteriet</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/artiklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Alla artiklar
            </Link>
          </nav>
        </div>
      </header>

      <main className="container max-w-2xl py-16">
        <Card className="bg-card border-border overflow-hidden">
          {/* Celebration header */}
          <div className="bg-gradient-to-br from-primary/20 via-success/10 to-primary/20 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Trophy className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-3 animate-fade-in">
              Grattis!
            </h1>
            <p className="text-lg text-muted-foreground animate-fade-in stagger-1">
              Du har slutfört hela kursen
            </p>
          </div>

          <CardContent className="p-8 text-center">
            {/* Stats */}
            <div className="flex justify-center gap-8 mb-8 animate-fade-in stagger-2">
              <div className="text-center">
                <p className="text-3xl font-heading text-primary">{totalArticles}</p>
                <p className="text-sm text-muted-foreground">artiklar lästa</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-heading text-primary">{totalArticles}</p>
                <p className="text-sm text-muted-foreground">quiz klarade</p>
              </div>
            </div>

            <p className="text-foreground/80 mb-8 max-w-md mx-auto animate-fade-in stagger-3">
              Du har nu läst alla artiklar och klarat alla quiz. Du har tagit ett fantastiskt steg för att bättre förstå och stötta din partner genom klimakteriet.
            </p>

            {/* Share section */}
            <div className="bg-muted/30 rounded-lg p-6 mb-8 animate-fade-in stagger-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-primary" />
                <h3 className="font-serif text-lg font-medium">Dela din prestation</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Inspirera andra att ta samma resa
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("twitter")}
                  className="gap-2"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("facebook")}
                  className="gap-2"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("linkedin")}
                  className="gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Kopierad!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopiera länk
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-5">
              <Button variant="outline" onClick={() => navigate("/artiklar")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Läs artiklarna igen
              </Button>
              <Button onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Till startsidan
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
