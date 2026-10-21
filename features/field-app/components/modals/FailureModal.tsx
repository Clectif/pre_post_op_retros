/* eslint-disable @next/next/no-img-element -- vista previa de un blob: URL local */
import { useRef, useState } from "react";
import { PHOTO_MAX_WIDTH, PHOTO_QUALITY } from "../../config";
import { FOLLOW_UPS } from "../../data/inspection-items";
import { useToast } from "../../hooks/useToast";
import { compressImage } from "../../lib/image";
import { cn } from "../../lib/utils";
import type { InspectionItem, ItemResponse } from "../../types";
import { Button } from "../ui/Button";
import { TextArea, TextInput } from "../ui/fields";
import { Modal, ModalActions, ModalLabel, ModalSub, ModalTitle } from "../ui/Modal";
import { ToggleRow } from "../ui/ToggleRow";

interface FailureModalProps {
  item: InspectionItem;
  /** Respuesta previa si se está editando una falla ya registrada. */
  previous?: ItemResponse;
  onSave: (response: ItemResponse) => void;
  onCancel: () => void;
}

const MIN_DESCRIPTION = 10;

export function FailureModal({ item, previous, onSave, onCancel }: FailureModalProps) {
  const toast = useToast();
  const followUps = item.sub ? FOLLOW_UPS[item.sub] : undefined;

  const [description, setDescription] = useState(previous?.obs ?? "");
  const [action, setAction] = useState("");
  const [checks, setChecks] = useState<boolean[]>(previous?.sub?.slice() ?? []);
  const [photo, setPhoto] = useState<Blob | null>(previous?.foto ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(previous?.fotoUrl ?? null);
  const fileInput = useRef<HTMLInputElement>(null);
  /** URLs creadas en este modal: las que no se guarden hay que liberarlas. */
  const created = useRef<string[]>([]);

  const releaseCreated = (keep: string | null) => {
    created.current.filter((u) => u !== keep).forEach((u) => URL.revokeObjectURL(u));
    created.current = [];
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await compressImage(file, PHOTO_MAX_WIDTH, PHOTO_QUALITY);
      const url = URL.createObjectURL(blob);
      created.current.push(url);
      setPhoto(blob);
      setPhotoUrl(url);
    } catch {
      toast("No se pudo procesar la foto. Intente de nuevo.");
    }
  };

  const save = () => {
    const text = description.trim();
    if (text.length < MIN_DESCRIPTION) return toast(`Describa el hallazgo (mínimo ${MIN_DESCRIPTION} caracteres).`);
    if (item.foto && !photo) return toast("Esta falla exige evidencia fotográfica.");

    const parts: string[] = [];
    followUps?.forEach((q, i) => parts.push(`${q.replace(/^¿|\?$/g, "")}: ${checks[i] ? "sí" : "no"}`));
    if (action.trim()) parts.push(action.trim());

    if (item.crit === "C") toast("Ítem crítico en falla: la máquina queda NO APTA.");
    releaseCreated(photoUrl);
    if (previous?.fotoUrl && previous.fotoUrl !== photoUrl) URL.revokeObjectURL(previous.fotoUrl);
    onSave({ estado: "falla", obs: text, accion: parts.join(" · ") || null, sub: checks.slice(), foto: photo, fotoUrl: photoUrl });
  };

  const cancel = () => {
    releaseCreated(null);
    onCancel();
  };

  return (
    <Modal>
      <ModalTitle>Falla · {item.id}</ModalTitle>
      <ModalSub>
        {item.txt} — criticidad {item.crit}
        {item.crit === "C" ? ". Una falla aquí deja la máquina NO APTA y notifica a mantenimiento." : "."}
      </ModalSub>

      <ModalLabel>¿Qué encontró? (obligatorio)</ModalLabel>
      <TextArea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describa el hallazgo: qué, dónde y desde cuándo."
      />

      {followUps && (
        <div>
          <ModalLabel>Seguimiento</ModalLabel>
          {followUps.map((q, i) => (
            <ToggleRow
              key={q}
              label={q}
              checked={!!checks[i]}
              onChange={(v) =>
                setChecks((c) => {
                  const next = c.slice();
                  next[i] = v;
                  return next;
                })
              }
            />
          ))}
        </div>
      )}

      <ModalLabel>Evidencia fotográfica ({item.foto ? "obligatoria" : "opcional"})</ModalLabel>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className={cn(
          "min-h-16 w-full cursor-pointer rounded-[14px] border-[1.5px] border-dashed p-3.5 text-center text-[13px] font-semibold",
          item.foto && !photoUrl ? "border-bad-line bg-bad-soft text-bad-ink" : "border-na/60 bg-field text-muted",
        )}
      >
        {photoUrl ? <img src={photoUrl} alt="Evidencia" className="mx-auto block max-w-full rounded-[10px]" /> : "📷 Tocar para tomar la foto"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void pickPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <ModalLabel>Acción inmediata tomada (opcional)</ModalLabel>
      <TextInput value={action} onChange={(e) => setAction(e.target.value)} placeholder="Ej.: se aisló el área, se avisó a mantenimiento…" />

      <ModalActions>
        <Button onClick={cancel}>Cancelar</Button>
        <Button variant="danger" onClick={save}>
          Guardar falla
        </Button>
      </ModalActions>
    </Modal>
  );
}
