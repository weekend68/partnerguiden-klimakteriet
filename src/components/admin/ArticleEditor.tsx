import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Article {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string;
  content: string;
  image_url: string | null;
  image_alt: string | null;
  image_filename: string;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

interface ArticleEditorProps {
  article: Article;
  onBack: () => void;
  onSave: (article: Article) => void;
}

export function ArticleEditor({ article, onBack, onSave }: ArticleEditorProps) {
  const [formData, setFormData] = useState<Article>(article);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (field: keyof Article, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("articles")
        .update({
          title: formData.title,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          excerpt: formData.excerpt,
          content: formData.content,
          image_url: formData.image_url,
          image_alt: formData.image_alt,
          image_filename: formData.image_filename,
          sort_order: formData.sort_order,
        })
        .eq("id", article.id);

      if (error) throw error;

      toast.success("Artikeln sparad!");
      onSave(formData);
    } catch (err) {
      console.error("Error saving article:", err);
      toast.error("Kunde inte spara artikeln");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till listan
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Dölj förhandsgranskning" : "Förhandsgranska"}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Spara
          </Button>
        </div>
      </div>

      <div className={showPreview ? "grid grid-cols-2 gap-6" : ""}>
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grundläggande information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Slug kan inte ändras efter skapande
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="excerpt">Pufftext (excerpt)</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Visas i artikellistor och mejlutskick
                </p>
              </div>

            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="meta_title">Meta-titel</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title || ""}
                  onChange={(e) => handleChange("meta_title", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.meta_title || "").length}/60 tecken
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="meta_description">Meta-beskrivning</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description || ""}
                  onChange={(e) =>
                    handleChange("meta_description", e.target.value)
                  }
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.meta_description || "").length}/160 tecken
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bild</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="image_filename">Bildfilnamn (för mejl)</Label>
                <Input
                  id="image_filename"
                  value={formData.image_filename}
                  onChange={(e) => handleChange("image_filename", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Fil i public/images/, t.ex. article-nar-varlden-skaver.jpg
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_alt">Bild alt-text</Label>
                <Textarea
                  id="image_alt"
                  value={formData.image_alt || ""}
                  onChange={(e) => handleChange("image_alt", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Artikelinnehåll (Markdown)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                rows={25}
                className="font-mono text-sm"
                placeholder="Skriv artikeln i Markdown-format..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Stödjer Markdown: # Rubrik, ## Underrubrik, **fetstil**,
                *kursiv*, [länk](url), etc.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <Card className="sticky top-4 h-fit max-h-[calc(100vh-8rem)] overflow-auto">
            <CardHeader>
              <CardTitle className="text-lg">Förhandsgranskning</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h1>{formData.title}</h1>
              <p className="lead text-muted-foreground">{formData.excerpt}</p>
              <div
                dangerouslySetInnerHTML={{
                  __html: formData.content
                    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.+?)\*/g, "<em>$1</em>")
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/^/, "<p>")
                    .replace(/$/, "</p>"),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
