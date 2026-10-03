/** A home-page section: kicker and heading on the left, a short summary on the right, then the content. */
export default function Section({
  id,
  className,
  kicker,
  title,
  aside,
  children,
}: {
  id: string;
  className?: string;
  kicker: React.ReactNode;
  title: React.ReactNode;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={className} data-reveal>
      <div className="section-head">
        <div>
          {kicker}
          <h2>{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
