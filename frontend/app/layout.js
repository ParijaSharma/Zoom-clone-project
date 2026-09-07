import "./globals.css";
import { Lato } from "next/font/google";
import AppShell from "@/components/AppShell";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata = {
  title: "Zoom Workplace Clone",
  description: "Functional Zoom Web Application Clone with WebSockets and WebRTC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${lato.className} min-h-screen bg-[#f7f8fc] antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}