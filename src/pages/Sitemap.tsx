import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Sitemap = () => {
  const [xml, setXml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("sitemap", {
          method: "GET",
        });

        if (error) {
          throw error;
        }

        // The response is XML text
        if (typeof data === "string") {
          setXml(data);
        } else {
          // If it came as parsed object, we need to fetch directly
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`
          );
          const text = await response.text();
          setXml(text);
        }
      } catch (err) {
        console.error("Error fetching sitemap:", err);
        setError("Failed to load sitemap");
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  // For search engines, we want to serve raw XML
  // This component will replace the entire document with XML
  useEffect(() => {
    if (xml && !loading) {
      // Replace document with raw XML for crawlers
      document.open("text/xml");
      document.write(xml);
      document.close();
    }
  }, [xml, loading]);

  if (loading) {
    return null;
  }

  if (error) {
    return <pre>{error}</pre>;
  }

  return null;
};

export default Sitemap;
