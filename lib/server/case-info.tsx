import { SIMULATOR_CASES } from "@/lib/simulator-cases";
import { getBadCodeSnippet, getGoodCodeSnippet } from "@/lib/server/case-code";
import type { CaseKey } from "@/types/simulator";
import CaseTipContent from "@/components/simulator/control-panel/CaseTipContent";
import CaseCodeBlock from "@/components/simulator/control-panel/CaseCodeBlock";

// Pre-renders every case's tip (including server-highlighted code blocks) once per device, server-side. Must be called from a Server Component (e.g. app/(shell)/layout.tsx) and the result passed down as a prop through Header into ControlPanelTogglers / MobileControlDrawer, both of which are "use client" and so can never import CaseCodeBlock (a Server Component) directly themselves.
//
// `device` picks which of a case's two content sets to render: a case whose bad/good code is identical on both platforms only defines `tip`, so `device: "mobile"` falls back to that same `tip`/snippet. Only a case like contextOverhead, whose global-store role genuinely differs by platform (see docs/case7.md), defines `mobileTip` and a `<key>.mobile.{bad,good}.txt` pair to override it. Called twice from the layout (once per device) rather than branching on isMobile inside CaseTipContent itself, so neither surface ever needs client-side media-query state to pick its own guide content.
export function getCaseTipContent(
  device: "desktop" | "mobile",
): Partial<Record<CaseKey, React.ReactNode>> {
  const items = SIMULATOR_CASES.flatMap((zone) => zone.items);

  return Object.fromEntries(
    items.map((item) => {
      const useMobileTip = device === "mobile" && item.mobileTip !== undefined;
      const tip = useMobileTip ? item.mobileTip! : item.tip;
      const snippetDevice = useMobileTip ? "mobile" : undefined;
      const badCodeSnippet = getBadCodeSnippet(item.key, snippetDevice);
      const goodCodeSnippet = getGoodCodeSnippet(item.key, snippetDevice);

      return [
        item.key,
        <CaseTipContent
          key={item.key}
          caseKey={item.key}
          tip={tip}
          badCodeBlock={
            badCodeSnippet ? <CaseCodeBlock code={badCodeSnippet} /> : undefined
          }
          goodCodeBlock={
            goodCodeSnippet ? (
              <CaseCodeBlock code={goodCodeSnippet} />
            ) : undefined
          }
        />,
      ];
    }),
  );
}
