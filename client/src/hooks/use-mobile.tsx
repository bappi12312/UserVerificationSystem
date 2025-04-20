import { useState, useEffect } from "react";

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    setIsMobile(window.innerWidth < 640);

    // Create event listener
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
