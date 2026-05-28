import Script from "next/script";

const TAG_ID = process.env.NEXT_PUBLIC_THRAD_TAG_ID || "adv_yield_demo";

// Loads the publisher Thrad tag (cdn.thrad.ai/tag.min.js) on every page.
// See https://tag-docs.thrad.ai/tag/install
export function ThradTag() {
  return (
    <>
      <Script
        id="thrad-tag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.thradTag = window.thradTag || function () {
              (window.thradTag.q = window.thradTag.q || []).push(arguments);
            };
            window.thradTag("set", { tag_id: ${JSON.stringify(TAG_ID)}, channel: "web" });
          `,
        }}
      />
      <Script
        src="https://cdn.thrad.ai/tag.min.js"
        strategy="afterInteractive"
        async
      />
    </>
  );
}
