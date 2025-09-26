import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans, fontMono, fontDisplay } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-dink-black text-dink-white",
          fontSans.variable,
          fontMono.variable,
          fontDisplay.variable,
        )}
      >
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "dark",
            themes: ["dark"],
            enableSystem: false,
          }}
        >
          <div className="relative min-h-screen overflow-hidden">
            <div className="court-pattern pointer-events-none absolute inset-0 opacity-10" />
            <div className="pointer-events-none absolute right-[-20%] top-[-10%] h-[520px] w-[520px] rounded-full bg-dink-gradient blur-[160px] opacity-40" />
            <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1880px] flex-col px-6 py-10 lg:px-12 2xl:px-20">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
