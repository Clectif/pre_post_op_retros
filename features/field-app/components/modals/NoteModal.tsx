import { useState } from "react";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/fields";
import { Modal, ModalActions, ModalSub, ModalTitle } from "../ui/Modal";

interface NoteModalProps {
  initial: string | null;
  /** null = borrar la nota. */
  onSave: (note: string | null) => void;
  onCancel: () => void;
}

export function NoteModal({ initial, onSave, onCancel }: NoteModalProps) {
  const [text, setText] = useState(initial ?? "");
  return (
    <Modal maxWidth={400}>
      <ModalTitle>Nota del registro</ModalTitle>
      <ModalSub>Opcional. Acompaña al próximo registro de extracción.</ModalSub>
      <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej.: frente norte, material con presencia de arcilla." />
      <ModalActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(text.trim() || null)}>
          Guardar
        </Button>
      </ModalActions>
    </Modal>
  );
}
