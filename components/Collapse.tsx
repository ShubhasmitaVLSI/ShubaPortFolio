/** A height-animated panel. Closed content is inert so it can't be tabbed into or read out. */
export default function Collapse({
  open,
  id,
  labelledBy,
  className = "",
  children,
}: {
  open: boolean;
  id?: string;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`collapse ${open ? "open" : ""} ${className}`}
      role={labelledBy ? "region" : undefined}
      aria-labelledby={labelledBy}
      inert={!open}
    >
      <div className="collapse-inner">{children}</div>
    </div>
  );
}
