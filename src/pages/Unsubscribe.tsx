import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle, AlertCircle } from "lucide-react";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const token = searchParams.get("token");

  useEffect(() => {
    const handleUnsubscribe = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        // Decode the token (base64 encoded user_id)
        const userId = atob(token);
        
        // Update user preferences to disable emails
        const { data, error } = await supabase
          .from("user_preferences")
          .update({ email_enabled: false })
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.error("Unsubscribe error:", error);
          setStatus("error");
          return;
        }

        if (!data) {
          setStatus("error");
          return;
        }

        if (data.email_enabled === false) {
          setStatus("success");
        } else {
          setStatus("already");
        }
      } catch (err) {
        console.error("Unsubscribe error:", err);
        setStatus("error");
      }
    };

    handleUnsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">
                Avregistrerar...
              </h1>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">
                Du är avregistrerad
              </h1>
              <p className="text-muted-foreground mb-6">
                Du kommer inte längre få mejl från Partnerguiden. Du kan fortfarande logga in och läsa artiklarna när som helst.
              </p>
              <Button asChild>
                <Link to="/">Till startsidan</Link>
              </Button>
            </>
          )}

          {status === "already" && (
            <>
              <MailX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">
                Redan avregistrerad
              </h1>
              <p className="text-muted-foreground mb-6">
                Du är redan avregistrerad från mejlutskicken.
              </p>
              <Button asChild>
                <Link to="/">Till startsidan</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">
                Något gick fel
              </h1>
              <p className="text-muted-foreground mb-6">
                Vi kunde inte avregistrera dig. Försök igen eller kontakta oss för hjälp.
              </p>
              <Button asChild>
                <Link to="/">Till startsidan</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
