import { useEffect, useState } from "react";
import { APP_VERSION } from "../version";

export default function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const savedVersion = localStorage.getItem("app_version");

    if (savedVersion && savedVersion !== APP_VERSION) {
      setUpdateAvailable(true);
    }

    localStorage.setItem("app_version", APP_VERSION);
  }, []);

  return { updateAvailable };
}
