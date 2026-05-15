"use client";

import Script from "next/script";

interface PixelScriptProps {
  metaPixelId?: string;
  googleAnalyticsId?: string;
}

export function PixelScript({ metaPixelId, googleAnalyticsId }: PixelScriptProps) {
  return (
    <>
      {metaPixelId ? (
        <Script
          id={`meta-pixel-${metaPixelId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
            `.trim(),
          }}
        />
      ) : null}

      {googleAnalyticsId ? (
        <>
          <Script
            id={`ga-loader-${googleAnalyticsId}`}
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          />
          <Script
            id={`ga-init-${googleAnalyticsId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');
              `.trim(),
            }}
          />
        </>
      ) : null}
    </>
  );
}
