import { createFileRoute } from "@tanstack/react-router";
import { handleAuditAssistant } from "@/lib/ai/audit-assistant.server";

export const Route = createFileRoute("/api/audit-assistant")({
  server: { handlers: { POST: ({ request }) => handleAuditAssistant(request) } },
});
