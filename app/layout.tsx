import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./motion.css";
import "./dv.css";
import "./booking.css";
import { profile } from "@/lib/data";
import { glossary, seoKeywords } from "@/lib/dv";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Shubhasmita Sahoo — Design Verification Engineer",
  description:
    "Portfolio of Shubhasmita Sahoo, Design Verification Engineer at Synopsys. IP and SoC verification, GLS-SDF, FIFO, SVA, coverage closure and emulation support.",
  keywords: seoKeywords,
  authors: [{ name: "Shubhasmita Sahoo", url: "https://www.linkedin.com/in/shubhasmitavlsi" }],
  openGraph: {
    title: "Shubhasmita Sahoo — Design Verification Engineer",
    description: "IP · SoC verification. GLS-SDF, SVA, UVM, emulation. Bengaluru.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Shubhasmita Sahoo — Design Verification Engineer",
    description: "IP · SoC verification. GLS-SDF, SVA, UVM, emulation. Bengaluru.",
  },
};

export const viewport: Viewport = { themeColor: "#0b1213" };

// Structured data so search engines read the DV expertise.
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  worksFor: { "@type": "Organization", name: profile.company },
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  alumniOf: ["National Institute of Technology Rourkela", "Kalinga Institute of Industrial Technology"],
  knowsAbout: [...glossary.map((g) => g.full), ...seoKeywords.slice(0, 20)],
  sameAs: [profile.linkedin],
};

// Applied before paint so the saved theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem('dv-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('dv-booted'))d.classList.add('no-boot');}catch(e){d.classList.add('no-boot');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="circuit"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      </head>
      <body>
        <noscript>
          <style>{`html.js [data-reveal],.reveal,.letter,.stagger>*{opacity:1!important;transform:none!important;translate:none!important;clip-path:none!important;filter:none!important}.boot{display:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}


