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

interface AboutProps {
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
      <div className="text-brand-muted leading-[1.6]">{children}</div>
    </div>
  );
}

export default function About({ collapsed = false }: AboutProps) {
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
      <DialogContent size="md" variant="brand" initialFocus={false}>
        <DialogHeader icon={<Info className="size-5" />} iconTone="brand">
          <DialogTitle>About</DialogTitle>
        </DialogHeader>
        <div className="-mr-3 flex max-h-[70vh] flex-col gap-heading-gap overflow-y-auto pr-3 text-base">
          <AboutSection title="Welcome!">
            <p>
              Have you ever tried to explain to a stakeholder or a team member
              exactly why a specific code architecture decision matters, only to
              watch their eyes glaze over? This project was born out of a simple
              idea: stop talking about frontend performance in theory, and start
              showing it in action.
            </p>
          </AboutSection>

          <AboutSection title="What is this?">
            <p>
              This is a demo B2B analytics dashboard (complete with Inventory
              Control) that looks and feels like a real, working production
              interface. The twist? You can deliberately turn on well-known
              frontend anti-patterns and watch them degrade performance in
              real-time. Instead of reading dry documentation, you get to see
              exactly where the LCP/CLS hit comes from and why the UI stutters,
              with live numbers and immediate visual effects.
            </p>
          </AboutSection>

          <AboutSection title="What can you do here?">
            <ul className="list-disc space-y-1 pl-heading-gap">
              <li>
                Flip toggles in the control panel (Network / Rendering /
                Computing) to simulate specific frontend problems.
              </li>
              <li>
                Stack effects by combining multiple toggles at once to see how
                errors compound.
              </li>
              <li>
                Watch live metrics (LCP, CLS, INP, and more) update instantly at
                the bottom of your screen.
              </li>
              <li>
                Track UI stress using the Flash on Update feature to highlight
                exactly which components are re-rendering.
              </li>
              <li>
                Read the guides attached to each case for a short breakdown of
                the problem, reproduction steps, and a side-by-side bad vs. good
                code comparison.
              </li>
            </ul>
          </AboutSection>

          <AboutSection title="How to use it?">
            <ol className="list-decimal space-y-1 pl-heading-gap">
              <li>Open the control panel.</li>
              <li>Turn on any anti-pattern toggle.</li>
              <li>
                Watch the metrics panel and the UI change. (Open the case&apos;s
                guide if you want a full breakdown.)
              </li>
              <li>
                Turn it off to compare the &quot;before&quot; and
                &quot;after&quot; states.
              </li>
            </ol>
          </AboutSection>

          <AboutSection title="A note on metric behavior">
            <p>
              Blocking Time and Interaction Latency only update when a new
              qualifying event happens (like a Long Task over 50ms or a slow
              click). They are not a &quot;current state&quot; gauge. If you
              turn a case off and click around quickly, the metric might still
              show the last bad reading until a new event updates it.
              That&apos;s just the metric doing its job, not the app staying
              broken!
            </p>
          </AboutSection>

          <div className="border-t border-brand-border pt-heading-gap">
            <AboutSection title="Behind the Scenes & Insights">
              <p className="mb-2.5">
                Hi, I&apos;m Julia Strelkova, a frontend developer at Invirial.
                This is my personal project exploring how engineering choices
                translate into hard data.
              </p>
              <p className="mb-2.5">
                Developing a perfectly controlled, measurable anti-pattern that
                breaks the user interface exactly where and how you want it to
                is surprisingly difficult. Writing clean code is a habit, but
                forcing it to break predictably is a whole different challenge.
                What makes it even trickier is that modern hardware, fast CPUs,
                CDNs, and production build optimizations can sometimes mask
                these bugs, meaning the effects won&apos;t always look equally
                dramatic on every device.
              </p>
              <p className="mb-2.5">
                This dashboard was built using a modern Human-in-the-Loop AI
                workflow. Working alongside AI agents as co-pilots allowed me to
                efficiently handle the boilerplate and heavy lifting, while I
                stayed in the driver&apos;s seat to architect the scenarios. I
                worked hard to fine-tune every bottleneck so that, in the vast
                majority of cases, you can actually &quot;feel&quot; and
                experiment with the real-world impact of these anti-patterns.
              </p>
              <p className="mb-2.5">
                Feel free to break the dashboard, explore the metrics, and
                hopefully take some useful insights back to your own production
                codebase!
              </p>
              <div className="mt-5 mb-3 flex flex-row gap-10 text-sm">
                <a
                  href="https://github.com/juli2a/PerformanceSaboteur"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-accent hover:text-foreground"
                >
                  <ExternalLink className="size-3.75" />
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/juliastrelkova/"
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
