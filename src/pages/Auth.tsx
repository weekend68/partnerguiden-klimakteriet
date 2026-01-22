import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, BarChart3, GraduationCap, Shield, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: "Inloggning misslyckades",
        description: error.message === "Invalid login credentials" 
          ? "Fel e-post eller lösenord" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Välkommen tillbaka!",
        description: "Du är nu inloggad.",
      });
      navigate("/");
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast({
        title: "Ange din e-post",
        description: "Fyll i din e-postadress ovan så skickar vi en återställningslänk.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Always use production domain for password reset redirect
    const redirectUrl = import.meta.env.PROD 
      ? "https://partnerguiden.se/auth" 
      : `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Kunde inte skicka länk",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Återställningslänk skickad",
        description: "Kolla din e-post för att återställa lösenordet.",
      });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (signupPassword.length < 6) {
      toast({
        title: "Lösenordet är för kort",
        description: "Lösenordet måste vara minst 6 tecken.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      toast({
        title: "Registrering misslyckades",
        description: error.message === "User already registered"
          ? "Den här e-postadressen är redan registrerad"
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Konto skapat!",
        description: "Du är nu inloggad.",
      });
      navigate("/");
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const benefits = [
    {
      icon: Mail,
      title: "Dagligt mail",
      description: "Få nästa artikel direkt i din inbox – vi hjälper dig hålla kursen"
    },
    {
      icon: BarChart3,
      title: "Följ dina framsteg",
      description: "Se hur långt du kommit och vad som återstår"
    },
    {
      icon: GraduationCap,
      title: "Diplom",
      description: "Få ett diplom när du klarat alla quiz"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back link */}
      <div className="container pt-4">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Tillbaka till startsidan
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left side - Sales copy */}
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-3">
                  Få kursen levererad till din inbox
                </h1>
                <p className="text-lg text-muted-foreground">
                  Skapa ett gratis konto och få ett mail per dag med nästa artikel. 
                  Så behöver du inte komma ihåg att komma tillbaka.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust signals */}
              <div className="flex items-start gap-3 pt-4 border-t border-border">
                <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Vi säljer aldrig dina uppgifter. Du kan avregistrera dig när som helst med ett klick.
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <Tabs defaultValue="signup" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signup">Skapa konto</TabsTrigger>
                    <TabsTrigger value="login">Logga in</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Namn (valfritt)</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Ditt namn"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">E-post</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="din@email.se"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Lösenord</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Minst 6 tecken"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Starta min resa
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Genom att skapa ett konto godkänner du vår{" "}
                        <Link to="/integritetspolicy" className="underline hover:text-foreground">
                          integritetspolicy
                        </Link>
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">E-post</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="din@email.se"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Lösenord</Label>
                          <button
                            type="button"
                            onClick={() => handleForgotPassword()}
                            className="text-xs text-primary hover:underline"
                          >
                            Glömt lösenord?
                          </button>
                        </div>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Logga in
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
