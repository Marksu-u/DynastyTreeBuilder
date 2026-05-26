"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ReportSchema = z.object({
  shareSlug: z.string().min(1, "Share slug is required"),
  reason: z.enum(["ILLEGAL_CONTENT", "HATE_SPEECH", "SPAM", "OTHER"]),
  details: z.string().max(500, "Details must be 500 characters or fewer").optional(),
});

export async function createReport(
  shareSlug: string,
  reason: string,
  details?: string
) {
  const parsed = ReportSchema.safeParse({ shareSlug, reason, details });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
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
