import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";

/** Slim bar above the header. Renders only when SITE_ANNOUNCEMENT_TEXT is set. */
export function AnnouncementBar() {
  const announcement = site.announcement;
  if (!announcement) return null;

  const content = (
    <>
      <span
        className="inline-flex size-1.5 shrink-0 rounded-full bg-accent-text"
        aria-hidden="true"
      />
      <span className="truncate">{announcement.text}</span>
      {announcement.href ? (
        <ArrowRight
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  const classes =
    "group mx-auto flex h-9 max-w-[1200px] items-center justify-center gap-2.5 px-5 text-[13px] text-fg-muted";

  return (
    <div className="border-b border-line bg-accent/[0.07]">
      {announcement.href ? (
        // A plain anchor: the target can be a site path or an external URL.
        <a href={announcement.href} className={`${classes} transition-colors hover:text-fg`}>
          {content}
        </a>
      ) : (
        <p className={classes}>{content}</p>
      )}
    </div>
  );
}
