import { certifications, education } from "@/lib/data";

export default function Education() {
  return (
    <>
      <div className="edu stagger">
        {education.map((e) => (
          <article className="edu-card spot" key={e.degree}>
            <time>{e.years}</time>
            <h3>{e.degree}</h3>
            <p>{e.school}</p>
          </article>
        ))}
      </div>
      <ul className="certs stagger">
        {certifications.map((c) => (
          <li key={c.name} className="spot">
            <span className="cert-year">{c.year}</span>
            <span className="cert-name">{c.name}</span>
            <span className="cert-by">{c.by}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
