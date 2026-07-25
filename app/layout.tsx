import type { Metadata } from "next";
import { Chakra_Petch, Manrope } from "next/font/google";
import SimulatorEffects from "@/components/simulator/performance-panel/SimulatorEffects";
import { MediaProvider } from "@/context/MediaContext";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PerfSaboteur",
  description: "B2B Merchant Analytics — frontend anti-pattern simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${chakraPetch.variable} dark h-full`}
    >
      <body className="h-full overflow-auto lg:overflow-hidden">
        <SimulatorEffects />
        <MediaProvider>{children}</MediaProvider>
      </body>
    </html>
  );
}
