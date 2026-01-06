// Shared article sequence for email sending
// This is the single source of truth for the email article order
// Edge functions import this data structure

export interface ArticleEmailData {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
}

export const ARTICLE_SEQUENCE: ArticleEmailData[] = [
  { 
    slug: "nar-varlden-skaver", 
    title: "Humörsvängningar - när världen skaver", 
    excerpt: "Hur hormonell omställning påverkar vardagens filter – och hur ni som par navigerar förändringen tillsammans.", 
    image: "article-nar-varlden-skaver.jpg" 
  },
  { 
    slug: "varmevallningar", 
    title: "Värmevallningar – när värmen blir svår att hantera", 
    excerpt: "När kroppen väcker dig mitt i natten – och hur sömnbristen påverkar allt annat.", 
    image: "article-varmevallningar.jpg" 
  },
  { 
    slug: "vardagens-osynliga-tyngd", 
    title: "Extrem trötthet - vardagens osynliga tyngd", 
    excerpt: "Frågan 'vad ska vi äta?' kan vara droppen som får bägaren att rinna över.", 
    image: "article-rummet-tvattstugan.jpg" 
  },
  { 
    slug: "narhet-pa-nya-villkor", 
    title: "Intimitet & närhet – på nya villkor", 
    excerpt: "När lusten förändras och beröringen blir komplicerad – så hittar ni tillbaka till varandra.", 
    image: "article-narhet-pa-nya-villkor.jpg" 
  },
  { 
    slug: "glomska-fokus", 
    title: "Glömska & fokus – När minnet blir en sil", 
    excerpt: "När orden försvinner mitt i meningen och kalendern blir din bästa vän.", 
    image: "article-glomska-fokus.jpg" 
  },
  { 
    slug: "oro-angest", 
    title: "Oro & ångest som inte släpper taget", 
    excerpt: "När ångesten ligger närmare ytan och stressen tar mer plats.", 
    image: "article-oro-angest.jpg" 
  },
  { 
    slug: "motivation-traning", 
    title: "Motivation & träning – när kroppen säger nej", 
    excerpt: "När kroppen inte längre svarar som den brukade och motivationen gömmer sig.", 
    image: "article-motivation-traning.jpg" 
  },
  { 
    slug: "osynlighet-varde", 
    title: "Osynlighet & värde – att känna sig bortglömd", 
    excerpt: "När samhällets blick glider förbi och känslan av att inte längre räknas växer.", 
    image: "article-osynlighet-varde.jpg" 
  },
  { 
    slug: "kropp-spegelbild", 
    title: "Kropp & spegelbild – Den främmande spegelbilden", 
    excerpt: "När kroppen förändras och spegelbilden känns obekant.", 
    image: "article-kropp-spegelbild.jpg" 
  },
  { 
    slug: "kommunikation", 
    title: "Att prata när det är svårt", 
    excerpt: "Konkreta verktyg för att kommunicera när känslorna är starka.", 
    image: "article-att-lyssna.jpg" 
  },
  { 
    slug: "sandwich-generationen", 
    title: "När ni båda har det tungt", 
    excerpt: "Att stötta varandra när livet trycker från flera håll samtidigt.", 
    image: "article-couplepause.jpg" 
  },
  { 
    slug: "klimakteriet-forklarat", 
    title: "Klimakteriet förklarat", 
    excerpt: "En guide till vad som händer i kroppen under klimakteriet.", 
    image: "article-hormon-kartan.jpg" 
  },
  { 
    slug: "hormonbehandling", 
    title: "Hormonbehandling: En guide för partners", 
    excerpt: "Vad du behöver veta om HRT – från myter till praktik.", 
    image: "article-hormonbehandling.jpg" 
  },
];

export const TOTAL_ARTICLES = ARTICLE_SEQUENCE.length;
