/** SVG UI marks: never depend on an OS font or emoji presentation. */
export default function ActionIcon({ kind = "forward", className = "" }: {
  kind?: "forward" | "chevron" | "external" | "share" | "check";
  className?: string;
}) {
  const paths = {
    forward: "M4 12h16M14 6l6 6-6 6",
    chevron: "m9 5 7 7-7 7",
    external: "M14 4h6v6M20 4l-9 9M10 5H5v14h14v-5",
    share: "M12 16V3M7 8l5-5 5 5M5 13v7h14v-7",
    check: "m5 12 4 4L19 6",
  };
  return <svg aria-hidden="true" focusable="false" data-action-icon={kind}
    viewBox="0 0 24 24" width="1em" height="1em" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className={`inline-block shrink-0 align-middle ${className}`}>
    <path d={paths[kind]} />
  </svg>;
}
