"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACTIVE_JOB_STAGES, type ConversionJobStatus } from "@/server/convert/schema";

type JobEvent = {
  id: string;
  status: ConversionJobStatus;
  statusLabel: string;
  provider: "openai" | "mock";
  errorMessage: string | null;
};

const STAGE_ORDER = ACTIVE_JOB_STAGES.map((stage) => stage.status);

export function ConvertProgress({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const terminal = useRef(false);

  useEffect(() => {
    const source = new EventSource(`/api/convert/${jobId}/events`);
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as JobEvent & { error?: string; message?: string };
      if (payload.error) {
        terminal.current = true;
        setError(payload.message ?? "We lost that conversion.");
        source.close();
        return;
      }
      setJob(payload);
      if (payload.status === "complete") {
        terminal.current = true;
        source.close();
        router.push(`/convert/result/${jobId}`);
      }
      if (payload.status === "failed") {
        terminal.current = true;
        source.close();
        setError(payload.errorMessage ?? "The conversion did not finish.");
      }
    };
    source.onerror = () => {
      if (terminal.current) return;
      setError("The progress stream dropped. Refresh this page to reconnect.");
    };
    return () => source.close();
  }, [jobId, router]);

  const currentIndex = job ? STAGE_ORDER.indexOf(job.status) : -1;

  return (
    <div className="space-y-8">
      <ol className="space-y-3">
        {ACTIVE_JOB_STAGES.map((stage, index) => {
          const done = currentIndex > index || job?.status === "complete";
          const active = job?.status === stage.status;
          return (
            <li
              key={stage.status}
              className={cn(
                "rounded-2xl px-4 py-3 ring-1",
                active
                  ? "bg-terracotta/10 ring-terracotta"
                  : done
                    ? "bg-sage/15 ring-sage/40"
                    : "bg-white/70 ring-teal/10",
              )}
            >
              <p className="text-sm font-medium text-teal">
                {done ? "Done · " : active ? "Now · " : "Next · "}
                {stage.label}
              </p>
            </li>
          );
        })}
      </ol>

      {job?.provider === "mock" ? (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          No OpenAI key is set, so this run uses the local culinary mock. Add{" "}
          <code className="font-mono">OPENAI_API_KEY</code> to use the live model.
        </p>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/convert/again/${jobId}`)}
            >
              Change choices and thrive again
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/#thrive")}
            >
              Start over
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-teal/70">Stay here — we will open the Thrive Version when it is ready.</p>
      )}
    </div>
  );
}
