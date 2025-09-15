import { Metadata } from "next";
// import { Toaster } from "sonner";

import { Navbar } from "@/components/movie/navbar";
// import { ThemeProvider } from "@/components/custom/theme-provider";

// import "./globals.css";

export const metadata: Metadata = {
  // metadataBase: new URL("https://gemini.vercel.ai"),
  title: "movie",
  // description: "Next.js chatbot template using the AI SDK and Gemini.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
