import { BrandLink } from "@/components/ui/brand-link";
import { ButtonLink } from "@/components/ui/button";
import { SkipToContent } from "@/components/ui/skip-link";
import Link from "next/link";
import { HeroDemo } from "./hero-demo";
import { ScrollReveal } from "./scroll-reveal";
import { SiteHeader } from "./site-header";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

export function LandingPage() {
  return (
    <div className="landing-root">
      <SkipToContent />
      <ScrollReveal />
      <SiteHeader />
      <main id="main-content" className="wrap" tabIndex={-1}>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              FEEDBACK THAT REACHES YOUR TEAM IN TIME
            </div>
            <h1>Resolve Guest Issues Before They Become Bad Reviews</h1>
            <p className="lead">
              Put a QR code on every table. A 1 or 2 star rating alerts your
              manager with the exact table in seconds, and every guest gets an
              AI-written review draft they can edit and post.
            </p>
            <div className="cta">
              <ButtonLink href="/auth/signup">Create your QR codes</ButtonLink>
              <ButtonLink href="#how" variant="ghost">
                See how it works
              </ButtonLink>
            </div>
            <p className="sub">
              Guests need no app and no account. Setup takes about a minute.
            </p>
            <div className="hero-proof" aria-label="Key product benefits">
              <span>
                <CheckIcon />
                No guest app
              </span>
              <span>
                <CheckIcon />
                Instant email alerts
              </span>
              <span>
                <CheckIcon />
                Guest-controlled reviews
              </span>
            </div>
          </div>
          <HeroDemo />
        </section>

        <section className="sec">
          <h2>The same bad night, two different endings</h2>
          <div className="vs">
            <div>
              <h3>Without ScanReview</h3>
              <ol className="tl bad">
                <li>
                  <time>9:12 pm</time>The food arrives cold
                </li>
                <li>
                  <time>9:40 pm</time>The guest leaves without saying a word
                </li>
                <li>
                  <time>11:05 pm</time>They post a 2-star review
                </li>
                <li>
                  <time>Next day</time>You find out when it’s already public
                </li>
              </ol>
            </div>
            <div>
              <h3>With ScanReview</h3>
              <ol className="tl good">
                <li>
                  <time>9:12 pm</time>The guest scans the table’s code and taps
                  1 star
                </li>
                <li>
                  <time>9:12 pm</time>Table 7 alert lands in your manager’s
                  inbox
                </li>
                <li>
                  <time>9:14 pm</time>A manager stops by and fixes it
                </li>
                <li>
                  <time>9:40 pm</time>The guest posts a fair review using the AI
                  draft
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="sec" id="how">
          <h2>Set up once, hear about problems first</h2>
          <ol className="steps">
            <li>
              <h3>Print a code for each table</h3>
              <p>
                Enter how many tables you have and invite your manager. We
                create one labeled QR code per table.
              </p>
            </li>
            <li>
              <h3>Guests scan and rate</h3>
              <p>
                No app and no account. It takes about ten seconds on their
                phone.
              </p>
            </li>
            <li>
              <h3>The right person gets the alert</h3>
              <p>
                A 1 or 2 star rating emails your manager the table. Every guest
                can then turn their visit into a review draft.
              </p>
            </li>
          </ol>
        </section>

        <section className="sec" id="features">
          <h2>Built for busy floors</h2>
          <div className="feat">
            <div>
              <span className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <h3>Table-level alerts</h3>
              <p>
                Your team knows exactly where to walk, not just that someone is
                unhappy.
              </p>
            </div>
            <div>
              <span className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </span>
              <h3>Reviews guests can finish</h3>
              <p>
                A few taps become a clear draft. Guests edit it, copy it and
                post it themselves, on your Google Maps page if you add the
                link.
              </p>
            </div>
            <div>
              <span className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="M9 12h6" />
                </svg>
              </span>
              <h3>Anonymous by default</h3>
              <p>
                Guests never have to share a name or number. Leaving contact
                details is always optional.
              </p>
            </div>
            <div>
              <span className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <h3>Name your spots</h3>
              <p>
                Tables, counters, desks or your own label. QR captions and
                alerts follow your wording.
              </p>
              <div className="lab">
                <span>Table 4</span>
                <span>Counter 2</span>
                <span>Booth 1</span>
                <span>Cabana 9</span>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>See it on your own tables</h2>
          <ButtonLink href="/auth/signup" variant="band">
            Create your QR codes
          </ButtonLink>
          <p>Takes about a minute to set up.</p>
        </section>
      </main>

      <footer className="foot-wrap">
        <div className="wrap site-footer">
          <div className="footer-main">
            <div className="footer-brand">
              <BrandLink href="/" label="ScanReview home" />
              <p>
                Turn table-side feedback into a chance to make things
                right—before the guest leaves.
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-group">
                <h3>Explore</h3>
                <Link href="#how">How it works</Link>
                <Link href="#features">Features</Link>
                <Link href="#demo">Try the demo</Link>
              </div>
              <div className="footer-group">
                <h3>Get started</h3>
                <Link href="/auth/login">Log in</Link>
                <Link href="/auth/signup">Create your QR codes</Link>
              </div>
              <div className="footer-group">
                <h3>For your team</h3>
                <Link href="#how">Guest feedback</Link>
                <Link href="#how">Manager alerts</Link>
                <Link href="#how">AI review drafts</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 ScanReview. All rights reserved.</span>
            <Link href="#top" className="made">
              Back to top <span aria-hidden="true">↑</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
