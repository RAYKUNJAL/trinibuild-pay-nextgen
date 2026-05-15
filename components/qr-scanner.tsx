"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Html5QrcodeLib = typeof import("html5-qrcode");
type Html5QrcodeInstance = InstanceType<Html5QrcodeLib["Html5Qrcode"]>;
type TorchCapableTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean };
  applyConstraints?: (c: MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> }) => Promise<void>;
};

const REGION_ID = "qr-scanner-region";

export function QrScanner({
  onScan,
  onError,
  paused = false,
}: {
  onScan: (decoded: string) => void;
  onError?: (err: string) => void;
  paused?: boolean;
}) {
  const instanceRef = useRef<Html5QrcodeInstance | null>(null);
  const [running, setRunning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [starting, setStarting] = useState(false);

  async function start() {
    if (running || starting) return;
    setStarting(true);
    try {
      const mod: Html5QrcodeLib = await import("html5-qrcode");
      const instance = new mod.Html5Qrcode(REGION_ID, { verbose: false });
      instanceRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => onScan(decoded),
        () => {
          /* swallow per-frame decode errors */
        },
      );
      setRunning(true);

      // Detect torch capability
      const tracks = (instance.getRunningTrackSettings ? [] : []) as MediaStreamTrack[];
      const videoEl = document.querySelector<HTMLVideoElement>(`#${REGION_ID} video`);
      const stream = (videoEl?.srcObject ?? null) as MediaStream | null;
      const track = (stream?.getVideoTracks?.()[0] ?? tracks[0]) as TorchCapableTrack | undefined;
      const caps = track?.getCapabilities?.();
      setTorchSupported(Boolean(caps?.torch));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Failed to start scanner");
    } finally {
      setStarting(false);
    }
  }

  async function stop() {
    const inst = instanceRef.current;
    if (!inst) return;
    try {
      await inst.stop();
      await inst.clear();
    } catch {
      /* ignore */
    }
    instanceRef.current = null;
    setRunning(false);
    setTorchOn(false);
  }

  async function toggleTorch() {
    const videoEl = document.querySelector<HTMLVideoElement>(`#${REGION_ID} video`);
    const stream = videoEl?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0] as TorchCapableTrack | undefined;
    if (!track?.applyConstraints) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Torch not available");
    }
  }

  useEffect(() => {
    return () => {
      // best-effort cleanup
      void stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, []);

  useEffect(() => {
    if (paused && running) {
      void stop();
    }
  }, [paused, running]);

  return (
    <div className="w-full">
      <div
        id={REGION_ID}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-black",
          !running && "flex items-center justify-center",
        )}
      >
        {!running ? (
          <div className="text-center text-sm text-white/70">
            <Camera className="mx-auto mb-2 h-6 w-6" aria-hidden />
            Camera idle
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {!running ? (
          <Button onClick={() => void start()} disabled={starting || paused}>
            <Camera className="mr-2 h-4 w-4" aria-hidden />
            {starting ? "Starting..." : "Start scanner"}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void stop()}>
            <CameraOff className="mr-2 h-4 w-4" aria-hidden />
            Stop
          </Button>
        )}
        {torchSupported && running ? (
          <Button
            variant={torchOn ? "default" : "outline"}
            size="icon"
            aria-label={torchOn ? "Turn torch off" : "Turn torch on"}
            onClick={() => void toggleTorch()}
          >
            <Flashlight className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
