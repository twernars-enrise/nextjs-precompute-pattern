import { notFound } from "next/navigation";

// The target groups of elektramat.nl, plus "no choice yet".
export const segments = [
  "default",
  "type_particulier",
  "type_e-installatie",
  "type_w-installatie",
  "type_bouw",
  "type_anders_zakelijk",
] as const;

export type Segment = (typeof segments)[number];

export const defaultSegment: Segment = "default";

// Named after the form field Magento posts to /segmentation/targetgroup/save/.
export const segmentCookie = "target_group";

export const isSegment = (value: string | undefined): value is Segment =>
  value !== undefined && (segments as readonly string[]).includes(value);

export const resolveSegment = (value: string): Segment => {
  if (!isSegment(value)) {
    notFound();
  }

  return value;
};

// Private visitors see prices incl. VAT. Everyone else, including "default", sees excl. VAT,
// like elektramat.nl today.
export const isPrivate = (segment: Segment) =>
  segment === "default" || segment === "type_particulier";

export const vatDisplay = (segment: Segment) =>
  segment === "type_particulier" ? "incl" : "excl";
