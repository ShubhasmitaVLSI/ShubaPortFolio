import type { Metadata } from "next";
import BookingFlow from "@/components/BookingFlow";
import Effects from "@/components/Effects";
import Footer from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { profile } from "@/lib/data";

export const metadata: Metadata = {
  title: `Book a call — ${profile.name}`,
  description: `Book a 30-minute Google Meet with ${profile.name}, ${profile.role}. Available daily 6:30–10:00 PM IST.`,
};

const expect = [
  ["30 minutes on Google Meet", "The Meet link arrives in a calendar invitation the moment you book."],
  ["Daily, 6:30 – 10:00 PM IST", "Times are shown in IST, with your local time alongside."],
  ["Come with anything", "Roles, DV collaboration, mentorship, or questions about verification."],
];

export default function Book() {
  return (
    <>
      <Effects />
      <header className="nav">
        <a className="brand" href="/">
          <span className="mark">SS</span>
          <span className="brand-name">Shubhasmita</span>
        </a>
        <nav className="nav-links show" aria-label="Primary">
          <a href="/">← Home</a>
          <a href="/blog">Blog</a>
        </nav>
      </header>
      <main className="book" id="top">
        <div className="book-intro">
          <p className="kicker reveal">Let&apos;s talk</p>
          <h1 className="reveal d1">
            Book a <em>30-minute</em> call.
          </h1>
          <p className="lede reveal d2">
            Pick a time that suits you. {profile.first} gets your details right away, and you get a Google Calendar
            invitation with the Meet link.
          </p>
          <ul className="book-expect reveal d3">
            {expect.map(([title, body]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{body}</span>
              </li>
            ))}
          </ul>
          <p className="book-alt reveal d3">
            Prefer to write?{" "}
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              Message on LinkedIn →
            </a>
          </p>
        </div>
        <div className="book-card spot reveal d2">
          <BookingFlow />
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
