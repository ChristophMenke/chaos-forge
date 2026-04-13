import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Chaos Forge",
};

export default function ImpressumPage() {
  return (
    <div
      className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-16"
      data-testid="impressum-page"
    >
      <h1 className="font-heading mb-6 text-3xl text-primary sm:text-4xl">Impressum</h1>

      <section className="space-y-4 text-sm leading-relaxed text-foreground/90">
        <h2 className="font-heading text-lg text-primary">Angaben gemäß § 5 TMG &amp; § 18 MStV</h2>
        <address className="not-italic">
          Christoph Menke
          <br />
          Waterloostraße 65
          <br />
          28201 Bremen
          <br />
          Deutschland
        </address>

        <h2 className="font-heading text-lg text-primary">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a href="mailto:Chris.toph.menke@gmail.com" className="text-primary hover:underline">
            Chris.toph.menke@gmail.com
          </a>
        </p>

        <h2 className="font-heading text-lg text-primary">Verantwortlich für den Inhalt</h2>
        <p>Christoph Menke (Anschrift wie oben)</p>

        <h2 className="font-heading text-lg text-primary">Hinweis</h2>
        <p>
          Chaos Forge ist ein privates, nicht-kommerzielles Angebot für eine geschlossene
          Spielgruppe. Die App dient ausschließlich der Organisation einer privaten
          Pen-&amp;-Paper-Rollenspielgruppe und erzeugt keine Einnahmen.
        </p>

        <h2 className="font-heading text-lg text-primary">Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
          Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </p>
      </section>
    </div>
  );
}
