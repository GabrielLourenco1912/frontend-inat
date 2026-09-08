"use client";

import {
  Component,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SectionHeading, Sheet } from "@/components/design-system/PortalPrimitives";

type PlayerSource =
  | { kind: "video"; src: string }
  | { kind: "iframe"; src: string };

function safeMediaId(value: string | null | undefined) {
  return value && /^[A-Za-z0-9_-]{5,80}$/.test(value) ? value : null;
}

function youtubeSource(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = safeMediaId(url.pathname.split("/").filter(Boolean)[0]);
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const segments = url.pathname.split("/").filter(Boolean);
    id = safeMediaId(
      url.searchParams.get("v") ??
        (["embed", "shorts", "live"].includes(segments[0] ?? "")
          ? segments[1]
          : null),
    );
  }

  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

function vimeoSource(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const id = url.pathname.split("/").filter(Boolean).findLast((part) => /^\d+$/.test(part));
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

function dailymotionSource(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  const id = safeMediaId(host === "dai.ly" ? segments[0] : segments.at(-1)?.split("_")[0]);
  return id && (host === "dai.ly" || host === "dailymotion.com")
    ? `https://www.dailymotion.com/embed/video/${id}`
    : null;
}

function resolvePlayerSource(value: string): PlayerSource | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;

    const providerSource =
      youtubeSource(url) ?? vimeoSource(url) ?? dailymotionSource(url);
    if (providerSource) return { kind: "iframe", src: providerSource };

    if (/\.(?:mp4|webm|ogv|ogg|mov|m4v)$/i.test(url.pathname)) {
      return { kind: "video", src: url.toString() };
    }

    return { kind: "iframe", src: url.toString() };
  } catch {
    return null;
  }
}

class SilentPlayerBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Player({ url, title }: { url: string; title: string }) {
  const source = useMemo(() => resolvePlayerSource(url), [url]);
  const [failed, setFailed] = useState(false);
  if (!source || failed) return null;

  return (
    <Sheet className="mb-5 overflow-hidden">
      <SectionHeading
        title="Aula externa"
        description="Conteúdo disponibilizado em um serviço público externo."
        icon="video"
      />
      <div className="aspect-video w-full bg-black">
        {source.kind === "video" ? (
          <video
            src={source.src}
            title={title}
            controls
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
            className="size-full bg-black"
          >
            Seu navegador não suporta a reprodução deste vídeo.
          </video>
        ) : (
          <iframe
            src={source.src}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-presentation allow-same-origin allow-scripts"
            onError={() => setFailed(true)}
            className="size-full border-0"
          />
        )}
      </div>
    </Sheet>
  );
}

export function ExternalLessonPlayer({
  url,
  title,
}: {
  url?: string | null;
  title: string;
}) {
  if (!url) return null;
  return (
    <SilentPlayerBoundary key={url}>
      <Player url={url} title={title} />
    </SilentPlayerBoundary>
  );
}
