import type { Stage } from "../../types";
import { Magnifier } from "./Magnifier";

const QUICK: { label: string; amount: number; tone: string }[] = [
  { label: "+5", amount: 5, tone: "border-line text-ink" },
  { label: "+10", amount: 10, tone: "border-line text-ink" },
  { label: "Borrar", amount: 0, tone: "border-bad-line text-bad-ink" },
];

interface ExtractionPanelProps {
  stage: Stage;
  buckets: number;
  /** Capacidad del balde de la máquina en m³. */
  bucketCapacity: number;
  lastRegistered: string;
  registering: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  /** amount 0 = borrar el conteo. */
  onQuickAdd: (amount: number) => void;
  onRegister: () => void;
}

const CIRCLE_BUTTON =
  "size-[74px] shrink-0 cursor-pointer rounded-[20px] border border-line bg-field text-[32px] font-semibold text-ink active:bg-accent-soft active:text-accent short:size-16 short:text-[28px]";

/** Panel derecho: material elegido, contador de baldes, volumen y botón de registrar. */
export function ExtractionPanel(p: ExtractionPanelProps) {
  const m3 = (p.buckets * p.bucketCapacity).toFixed(1);
  return (
    <div className="absolute top-[calc(50%-50px)] right-4 max-h-[calc(100%-114px)] w-[330px] -translate-y-1/2 overflow-auto rounded-[22px] border border-line bg-panel p-[18px] shadow-card max-[1180px]:w-[300px]">
      <div className="text-[11px] font-semibold tracking-[.16em] text-muted uppercase">Material extraído</div>
      <div className="mt-1.5 text-[23px] leading-[1.1] font-semibold text-accent">{p.stage.n}</div>
      <div className="mt-[9px] inline-block rounded-full bg-[#efe7d6] px-3 py-[5px] text-xs font-semibold text-[#46402c]">{p.stage.mm}</div>

      <Magnifier stage={p.stage} />

      <div className="mt-3 flex items-center gap-2.5">
        <button type="button" aria-label="Quitar un balde" onClick={p.onDecrement} className={CIRCLE_BUTTON}>
          −
        </button>
        <div className="flex-1 text-center">
          <b className="block text-[44px] leading-none font-semibold tabular-nums short:text-[36px]">{p.buckets}</b>
          <span className="text-[10.5px] font-semibold tracking-[.16em] text-muted uppercase">Baldes</span>
        </div>
        <button type="button" aria-label="Agregar un balde" onClick={p.onIncrement} className={CIRCLE_BUTTON}>
          +
        </button>
      </div>

      <div className="mt-2.5 text-center text-[15px] font-semibold text-ok-ink tabular-nums">
        {m3} m³ <small className="text-[11px] font-medium text-muted">· balde de {p.bucketCapacity.toFixed(2)} m³</small>
      </div>

      <div className="mt-2.5 flex gap-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => p.onQuickAdd(q.amount)}
            className={`min-h-12 flex-1 cursor-pointer rounded-[13px] border bg-field text-[13px] font-bold active:bg-subtle ${q.tone}`}
          >
            {q.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={p.buckets <= 0 || p.registering}
        onClick={p.onRegister}
        className="mt-3 min-h-16 w-full cursor-pointer rounded-2xl bg-accent text-base font-bold text-white shadow-primary disabled:bg-line disabled:text-muted disabled:shadow-none short:min-h-14"
      >
        Registrar extracción
      </button>
      <div className="mt-[9px] min-h-[14px] text-center text-[11px] leading-[1.35] font-medium text-ok-ink">{p.lastRegistered}</div>
    </div>
  );
}
