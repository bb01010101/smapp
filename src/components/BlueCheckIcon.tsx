import React from "react";

export default function BlueCheckIcon({ className = "", style = {} }) {
  return (
    <svg
      className={className}
      style={style}
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <circle cx="24" cy="24" r="24" fill="#4DB2FF"/>
        <path d="M34.5 18.5L22 31L15.5 24.5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
} 