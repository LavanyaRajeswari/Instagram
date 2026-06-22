import { useNavigate } from "react-router-dom";

const TOKEN_PATTERN = /([#@][A-Za-z0-9_]+)/g;

function LinkedText({ text = "" }) {
  const navigate = useNavigate();
  const parts = String(text).split(TOKEN_PATTERN);

  return (
    <>
      {parts.map((part, index) => {
        if (/^#[A-Za-z0-9_]+$/.test(part)) {
          return (
            <button
              key={`${part}-${index}`}
              type="button"
              onClick={() => navigate(`/hashtags/${part.slice(1).toLowerCase()}`)}
              className="font-semibold text-[#00376b] hover:underline"
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
              onClick={() => navigate(`/profile?username=${encodeURIComponent(part.slice(1))}`)}
              className="font-semibold text-[#00376b] hover:underline"
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

export default LinkedText;
