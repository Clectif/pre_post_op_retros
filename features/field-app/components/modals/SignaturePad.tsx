import { useEffect, useImperativeHandle, useRef, type PointerEvent, type Ref } from "react";

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  /** Firma como data URL PNG. */
  toDataURL: () => string;
  clear: () => void;
  scrollIntoView: () => void;
}

/** Lienzo de firma a mano alzada (el buffer es el doble del tamaño visible para que no se vea pixelada). */
export function SignaturePad({ ref }: { ref: Ref<SignaturePadHandle> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const empty = useRef(true);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    c.width = c.clientWidth * 2;
    c.height = c.clientHeight * 2;
    const g = c.getContext("2d");
    if (!g) return;
    g.scale(2, 2);
    g.lineWidth = 2.2;
    g.lineCap = "round";
    g.strokeStyle = "#1c1f24";
    ctx.current = g;
  }, []);

  useImperativeHandle(ref, () => ({
    isEmpty: () => empty.current,
    toDataURL: () => canvas.current?.toDataURL("image/png") ?? "",
    clear: () => {
      const c = canvas.current;
      if (c && ctx.current) ctx.current.clearRect(0, 0, c.width, c.height);
      empty.current = true;
    },
    scrollIntoView: () => canvas.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
  }));

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <canvas
      ref={canvas}
      aria-label="Firma del operario"
      className="h-[120px] w-full touch-none rounded-[14px] border border-line bg-field short:h-[92px]"
      onPointerDown={(e) => {
        drawing.current = true;
        empty.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = pos(e);
        ctx.current?.beginPath();
        ctx.current?.moveTo(p.x, p.y);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const p = pos(e);
        ctx.current?.lineTo(p.x, p.y);
        ctx.current?.stroke();
      }}
      onPointerUp={() => {
        drawing.current = false;
      }}
    />
  );
}
