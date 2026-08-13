"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkIpRateLimit, clientIp } from "@/lib/rate-limit";

const ReportSchema = z.object({
  shareSlug: z.string().min(1, "Share slug is required").max(200, "Invalid share link"),
  reason: z.enum(["ILLEGAL_CONTENT", "HATE_SPEECH", "SPAM", "OTHER"]),
  details: z.string().max(500, "Details must be 500 characters or fewer").optional(),
});

// Reporting is deliberately open to anyone who can see a shared tree — there is
// no account to key on. That makes it the one write path with no session, so the
// limit is per-address and tight: a handful an hour is far more than a real
// person needs, and enough to stop the endpoint being a free write loop.
const REPORT_LIMIT = 10;
const REPORT_WINDOW_MS = 60 * 60 * 1000;

export async function createReport(
  shareSlug: string,
  reason: string,
  details?: string
) {
  const parsed = ReportSchema.safeParse({ shareSlug, reason, details });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const ip = clientIp(await headers());
  if (!checkIpRateLimit(ip, REPORT_LIMIT, REPORT_WINDOW_MS)) {
    return { error: "You've sent several reports already. Please try again later." };
  }

  // The slug has to name something real. Without this the action accepts any
  // string, so `reports` could be filled with rows that point at nothing.
  // Existence only, deliberately not `isPublic` — a tree that was just taken
  // private is exactly the kind of thing someone is reporting, and dropping
  // those reports would lose the ones that matter most.
  const dynasty = await prisma.dynasty.findUnique({
    where: { slug: parsed.data.shareSlug },
    select: { id: true },
  });
  if (!dynasty) {
    return { error: "We couldn't find that tree. It may already have been removed." };
  }

  try {
    await prisma.report.create({
      data: {
        source: "DYNASTY_TREE_BUILDER",
        shareSlug: parsed.data.shareSlug,
        reason: parsed.data.reason,
        details: parsed.data.details,
      },
    });
    return { success: true };
  } catch {
    return { error: "Failed to submit report. Please try again." };
  }
}
