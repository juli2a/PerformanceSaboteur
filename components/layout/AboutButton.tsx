"use client";

import { CircleHelp, ExternalLink, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AboutButtonProps {
  collapsed?: boolean;
}

interface AboutSectionProps {
  title: string;
  children: React.ReactNode;
}

function AboutSection({ title, children }: AboutSectionProps) {
  return (
    <div>
      <p className="mb-1.75 text-[15px] font-semibold text-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function AboutButton({ collapsed = false }: AboutButtonProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            title={collapsed ? "About" : undefined}
            className="h-auto w-full justify-start gap-3.25 rounded px-3.5 py-3 text-sm leading-[18px]"
          />
        }
      >
        <span className="grid size-4.5 shrink-0 place-items-center">
          <CircleHelp size={18} className="text-text-3" />
        </span>
        {!collapsed && (
          <span className="animate-in fade-in-10 duration-600">About</span>
        )}
      </DialogTrigger>
      <DialogContent size="md" variant="brand">
        <DialogHeader icon={<Info className="size-5" />} iconTone="brand">
          <DialogTitle>About</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-heading-gap overflow-y-auto text-base">
          <AboutSection title="What is this?">
            <p className="leading-[1.6] text-brand-muted">
              A demo B2B analytics dashboard (Dashboard + Inventory Control)
              that looks like a real working interface — but lets you flip on
              well-known frontend anti-patterns live and watch them tank
              performance in real time.
            </p>
          </AboutSection>

          <AboutSection title="Why?">
            <p className="leading-[1.6] text-brand-muted">
              To make it visible and measurable what actually happens in
              production when best practices get skipped — where the LCP/CLS hit
              comes from, why the UI stutters. Not theory — live numbers and
              effect.
            </p>
          </AboutSection>

          <AboutSection title="What can you do?">
            <ul className="list-disc space-y-1 pl-heading-gap leading-[1.6] text-brand-muted">
              <li>
                Flip toggles in the control panel (Network / Rendering /
                Computing) — each one simulates a specific problem.
              </li>
              <li>Combine toggles — effects stack.</li>
              <li>
                Open a case&apos;s guide — a short breakdown of the problem, how
                to reproduce it, its effect, and a bad/good code comparison.
              </li>
              <li>
                Watch the metrics panel (LCP, CLS, INP, etc.) update live at the
                bottom of the screen.
              </li>
              <li>
                See Flash on Update highlight which components just re-rendered.
              </li>
            </ul>
          </AboutSection>

          <AboutSection title="How to use it?">
            <ol className="list-decimal space-y-1 pl-heading-gap leading-[1.6] text-brand-muted">
              <li>Open the control panel.</li>
              <li>Turn on one anti-pattern.</li>
              <li>
                Watch what changes in the metrics and on screen (open the
                case&apos;s guide if you want the full breakdown).
              </li>
              <li>Turn it off — compare before and after.</li>
            </ol>
          </AboutSection>

          <AboutSection title="A couple of honest notes">
            <ul className="list-disc space-y-1 pl-heading-gap leading-[1.6] text-brand-muted">
              <li>
                Blocking Time and Interaction Latency only update when a new
                qualifying event happens — a Long Task over 50ms, a slow tap
                or click. They&apos;re not a live &quot;current state&quot;
                gauge. Turn a case off, click around with cheap interactions,
                and the number can keep showing its last bad reading until
                something else actually crosses that threshold — that&apos;s
                the metric doing its job, not the case still being broken.
              </li>
              <li>
                Not every effect will look equally dramatic everywhere.
                Modern hardware and the hosting itself — faster CPUs, CDNs,
                production build optimizations — can shrink or mask some of
                these anti-patterns. What looks severe on one device or
                network may barely register on another.
              </li>
            </ul>
          </AboutSection>

          <div className="border-t border-brand-border pt-heading-gap">
            <AboutSection title="About author">
              <p className="mb-2.5 leading-[1.6] text-brand-muted">
                Built by Julia Strelkova, a frontend developer at Invirial — a
                personal project exploring how common frontend anti-patterns
                actually show up in the numbers.
              </p>
              <div className="flex flex-col gap-1.5 text-sm">
                <a
                  href="https://github.com/juli2a/PerfomanceSaboteur"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-accent hover:text-foreground"
                >
                  <ExternalLink className="size-3.75" />
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/juli-strelkova"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-accent hover:text-foreground"
                >
                  <ExternalLink className="size-3.75" />
                  LinkedIn
                </a>
              </div>
            </AboutSection>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
