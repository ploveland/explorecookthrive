import { getJob, publicJob } from "@/server/convert/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const tick = async () => {
        const job = await getJob(jobId);
        if (!job) {
          send({ error: "not_found", message: "We could not find that conversion." });
          return true;
        }
        send(publicJob(job));
        return job.status === "complete" || job.status === "failed";
      };

      try {
        if (await tick()) {
          controller.close();
          return;
        }

        const interval = setInterval(() => {
          void (async () => {
            try {
              if (await tick()) {
                clearInterval(interval);
                controller.close();
              }
            } catch {
              clearInterval(interval);
              controller.error(new Error("stream_failed"));
            }
          })();
        }, 250);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
