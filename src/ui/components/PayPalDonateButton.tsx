import { useEffect, useRef, type CSSProperties } from "react";

const SDK_SRC = "https://www.paypalobjects.com/donate/sdk/donate-sdk.js";
const HOSTED_BUTTON_ID = "8CWYF55H72QSY";
const BUTTON_IMAGE =
  "https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif";

declare global {
  interface Window {
    PayPal?: {
      Donation: {
        Button: (config: {
          env: string;
          hosted_button_id: string;
          image: { src: string; alt: string; title: string };
        }) => { render: (selector: string) => void };
      };
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;

function loadPayPalSdk(): Promise<void> {
  if (window.PayPal?.Donation) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.charset = "UTF-8";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

/** Renders PayPal's hosted donate button via their Donation SDK. */
export function PayPalDonateButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || renderedRef.current) return;

    let cancelled = false;

    loadPayPalSdk()
      .then(() => {
        if (cancelled || !containerRef.current || !window.PayPal?.Donation) return;
        containerRef.current.innerHTML = "";
        window.PayPal.Donation.Button({
          env: "production",
          hosted_button_id: HOSTED_BUTTON_ID,
          image: {
            src: BUTTON_IMAGE,
            alt: "Donate with PayPal button",
            title: "PayPal - The safer, easier way to pay online!",
          },
        }).render("#donate-button");
        renderedRef.current = true;
      })
      .catch(() => {
        if (cancelled || !containerRef.current) return;
        // Fallback: same hosted button as a plain link (works if SDK is blocked).
        containerRef.current.innerHTML = "";
        const link = document.createElement("a");
        link.href = `https://www.paypal.com/donate/?hosted_button_id=${HOSTED_BUTTON_ID}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const img = document.createElement("img");
        img.src = BUTTON_IMAGE;
        img.alt = "Donate with PayPal button";
        img.title = "PayPal - The safer, easier way to pay online!";
        img.style.border = "0";
        link.appendChild(img);
        containerRef.current.appendChild(link);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div id="donate-button-container" style={wrapper}>
      <div id="donate-button" ref={containerRef} />
    </div>
  );
}

const wrapper: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  lineHeight: 0,
};
