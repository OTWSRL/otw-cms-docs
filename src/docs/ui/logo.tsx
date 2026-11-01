/** OTW CMS's mark, as the admin's sign-in screen draws it. */
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 84 84" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="42" cy="42" r="38" fill="none" stroke="currentColor" strokeWidth="5" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="23" cy="42" r="8.5" />
        <path d="M35 33.5h15M42.5 33.5v17" />
        <path d="m53 33.5 3.5 17 4.5-12 4.5 12 3.5-17" />
      </g>
    </svg>
  )
}
