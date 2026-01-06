import { useEffect } from "react";

const DEFAULT_TITLE = "Partnerguiden: Klimakteriet – Stötta din partner genom förändringen";

export const useDocumentTitle = (title?: string | null) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // Reset to default when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
};
