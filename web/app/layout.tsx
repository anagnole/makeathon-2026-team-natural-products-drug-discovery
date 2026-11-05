import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-martian",
});

export const metadata: Metadata = {
  title: "The Microdilution Read",
  description:
    "A per-pathogen virtual screen over plant chemistry, read like the assay its labels came from: every predicted score shown with its distance from anything the model has seen.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable}`}>
      <body>{children}</body>
    </html>
  );
}
