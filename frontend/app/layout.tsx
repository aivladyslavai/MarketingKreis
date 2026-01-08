import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// import { CRMProvider } from "@/contexts/crm-context" // TEMP DISABLED

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Marketing Kreis Platform",
  description: "Swiss Marketing Management Platform",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              var mode = localStorage.getItem('themeMode');
              // backward compatibility
              if (!mode) {
                var legacy = localStorage.getItem('theme');
                if (legacy === 'dark' || legacy === 'light') { mode = legacy; }
              }
              if (!mode) { mode = 'auto'; }
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = (mode === 'dark') || (mode === 'auto' && prefersDark);
              document.documentElement.classList.toggle('dark', isDark);
              document.documentElement.setAttribute('data-theme-mode', mode);
              localStorage.setItem('themeMode', mode);
            } catch (e) {}
          `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              try {
                var read = function(){ try { return JSON.parse(localStorage.getItem('featureFlags')||'{}') } catch(e) { return {} } };
                var patch = function(){
                  if (window.__mkFetchPatched) return;
                  window.__mkFetchPatched = true;
                  var orig = window.fetch;
                  window.__mkFetchOrig = orig;
                  window.fetch = async function(){
                    var args = Array.prototype.slice.call(arguments);
                    var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url) || '';
                    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
                    var res = await orig.apply(this, args);
                    var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
                    try { console.debug('[MK][fetch]', url, res.status, Math.round(t1 - t0) + 'ms'); } catch(e){}
                    return res;
                  }
                };
                var unpatch = function(){
                  if (window.__mkFetchPatched && window.__mkFetchOrig){
                    window.fetch = window.__mkFetchOrig;
                    window.__mkFetchPatched = false;
                  }
                };
                var apply = function(){
                  var ff = read();
                  if (ff && ff.debugNetwork) patch(); else unpatch();
                };
                apply();
                window.addEventListener('storage', function(e){ if (e.key === 'featureFlags') apply(); });
                window.addEventListener('mk:flags', apply);
              } catch(e) {}
            })();
          `,
          }}
        />
        {children}
      </body>
    </html>
  )
}