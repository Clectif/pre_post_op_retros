import { useState } from "react";
import { cn } from "../../lib/utils";
import type { ReadingDef } from "../../types";
import { Button } from "../ui/Button";
import { Modal, ModalActions, ModalSub, ModalTitle } from "../ui/Modal";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

interface KeypadModalProps {
  reading: ReadingDef;
  current: number | undefined;
  /** Mensaje de error si el valor no es válido para esta lectura. */
  validate: (value: number | null) => string | null;
  /** undefined = borrar la lectura (solo si es opcional). */
  onSave: (value: number | undefined) => void;
  onCancel: () => void;
}

/** Teclado numérico grande para guantes. El primer toque reemplaza el valor anterior. */
export function KeypadModal({ reading: l, current, validate, onSave, onCancel }: KeypadModalProps) {
  const [buffer, setBuffer] = useState(current !== undefined ? String(current) : "");
  const [fresh, setFresh] = useState(true);

  const press = (k: string) => {
    let buf = fresh && k !== "⌫" ? "" : buffer;
    if (k === "⌫") buf = buf.slice(0, -1);
    else if (k === ".") {
      if (!buf.includes(".") && l.dec > 0) buf += buf === "" ? "0." : ".";
    } else buf += k;
    setFresh(false);
    setBuffer(buf);
  };

  const value = buffer === "" ? null : parseFloat(buffer);
  const error = value === null ? null : validate(value);
  const disabled = (value === null && l.req) || !!error;

  const save = () => {
    if (value === null) return onSave(undefined);
    if (!validate(value)) onSave(value);
  };

  return (
    <Modal maxWidth={360}>
      <ModalTitle>{l.lbl}</ModalTitle>
      <ModalSub>
        {l.req ? "Obligatorio. " : "Opcional. "}
        {l.hint}
      </ModalSub>
      <div
        className={cn(
          "mt-2 mb-1.5 rounded-2xl border py-2 text-center text-[40px] leading-[1.2] font-semibold tabular-nums short:py-1 short:text-[32px]",
          error ? "border-bad-line bg-bad-soft text-bad-ink" : "border-line bg-subtle text-accent",
        )}
      >
        {buffer === "" ? "0" : buffer}
        <small className="ml-1 text-base font-medium text-muted">{l.u}</small>
      </div>
      <div className={cn("min-h-4 text-center text-xs font-medium", error ? "text-bad-ink" : "text-muted")}>{error}</div>
      <div className="mt-3.5 grid grid-cols-3 gap-[9px]">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="cursor-pointer rounded-[14px] border border-line bg-field py-4 text-[21px] font-semibold active:border-accent-line active:bg-accent-soft active:text-accent short:py-3"
          >
            {k}
          </button>
        ))}
      </div>
      <ModalActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" disabled={disabled} onClick={save}>
          Guardar
        </Button>
      </ModalActions>
    </Modal>
  );
}
