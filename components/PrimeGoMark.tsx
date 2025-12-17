import React from "react";

export default function PrimeGoMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="
          M6 12
          C10 6, 18 6, 24 12
          C30 18, 34 18, 40 12
          C46 6, 54 6, 58 12
          C54 18, 46 18, 40 12
          C34 6, 30 6, 24 12
          C18 18, 10 18, 6 12
        "
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
