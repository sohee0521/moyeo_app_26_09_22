import { useEffect } from "react";

export default function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? `MOYEO | ${title}` : "MOYEO";
  }, [title]);

  return null;
}
