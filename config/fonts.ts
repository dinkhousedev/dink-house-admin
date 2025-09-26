import {
  Fira_Code as FontMono,
  Inter as FontSans,
  Rajdhani as FontDisplay,
} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const fontDisplay = FontDisplay({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
