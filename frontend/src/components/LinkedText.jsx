import React from "react";
import { useNavigate } from "react-router-dom";

const HASHTAG_PATTERN = /^#[A-Za-z0-9_][A-Za-z0-9_\-\u2010-\u2015\u2212]*$/;
const TOKEN_PATTERN = /(#[A-Za-z0-9_][A-Za-z0-9_\-\u2010-\u2015\u2212]*|@[A-Za-z0-9_]+)/g;

function LinkedText({ text = "", onLinkClick }) {
  const navigate = useNavigate();
  const parts = String(text).split(TOKEN_PATTERN);

  const handleClick = (callback) => {
    callback();
    if (onLinkClick) onLinkClick();
  };

  return (
    <>
      {parts.map((part, index) => {
        if (HASHTAG_PATTERN.test(part)) {
          return (
            <button
              key={`${part}-${index}`}
              type="button"
              onClick={() => handleClick(() => navigate(`/hashtags/${part.slice(1).toLowerCase().replace(/[\u2010-\u2015\u2212]/g, "-")}`))}
              className="font-semibold text-link hover:underline"
            >
              {part}
            </button>
          );
        }

        if (/^@[A-Za-z0-9_]+$/.test(part)) {
          return (
            <button
              key={`${part}-${index}`}
              type="button"
              onClick={() => handleClick(() => navigate(`/profile?username=${encodeURIComponent(part.slice(1))}`))}
              className="font-semibold text-link hover:underline"
            >
              {part}
            </button>
          );
        }

        return part;
      })}
    </>
  );
}

export default React.memo(LinkedText);
