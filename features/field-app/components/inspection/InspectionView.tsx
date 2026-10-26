import { useEffect, useMemo, useState } from "react";
import { useNow } from "../../hooks/useNow";
import { useToast } from "../../hooks/useToast";
import type { InspectionController } from "../../hooks/useInspection";
import { InspectionScene, type InspectionSceneView } from "../../three/InspectionScene";
import { useScene } from "../../three/useScene";
import type { InspectionItem, ReadingDef } from "../../types";
import { FailureModal } from "../modals/FailureModal";
import { KeypadModal } from "../modals/KeypadModal";
import { CameraTools } from "../ui/CameraTools";
import { SceneHost } from "../ui/SceneHost";
import { StageLayout } from "../layout/StageLayout";
import { BottomBar } from "./BottomBar";
import { InspectionPanel } from "./InspectionPanel";
import { SectionRail } from "./SectionRail";
import { SECTIONS_BY_ID } from "./sections";

interface InspectionViewProps {
  inspection: InspectionController;
  onRequestSend: () => void;
  haptic: () => void;
}

/** Pestaña de inspección: máquina 3D al fondo y, encima, sistemas, ítems, avance y envío. */
export function InspectionView({ inspection, onRequestSend, haptic }: InspectionViewProps) {
  const { state, view } = inspection;
  const toast = useToast();
  const now = useNow(15_000);
  const [failureItem, setFailureItem] = useState<InspectionItem | null>(null);
  const [readingOpen, setReadingOpen] = useState<ReadingDef | null>(null);

  const { hostRef, sceneRef } = useScene(() => new InspectionScene());

  // el usuario toca un punto en la máquina → misma acción que tocar el sistema en la lista
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.onPick = inspection.selectSection;
  });

  // React manda; la escena solo dibuja
  const sceneView = useMemo<InspectionSceneView>(
    () => ({
      sections: view.sections.map((s) => ({ id: s.id, icon: s.ic })),
      status: view.status,
      selected: view.currentSec,
      part: SECTIONS_BY_ID[view.currentSec]?.part ?? null,
    }),
    [view.sections, view.status, view.currentSec],
  );
  useEffect(() => {
    sceneRef.current?.setView(sceneView);
  }, [sceneView, sceneRef]);

  const handleMark = (item: InspectionItem, estado: "ok" | "falla" | "na") => {
    if (estado === "falla") return setFailureItem(item);
    inspection.mark(item, estado);
    haptic();
  };

  return (
    <>
      <StageLayout
        scene={<SceneHost hostRef={hostRef} />}
        tools={
          <CameraTools
            onZoomIn={() => sceneRef.current?.zoom(0.88)}
            onZoomOut={() => sceneRef.current?.zoom(1.13)}
            onReset={() => sceneRef.current?.reset()}
            onNote={() => toast("La nota acompaña a los registros de extracción.")}
          />
        }
        rail={<SectionRail view={view} onSelect={inspection.selectSection} />}
        panel={
          <InspectionPanel
            state={state}
            view={view}
            now={now}
            onMark={handleMark}
            onOpenFailure={setFailureItem}
            onOpenReading={setReadingOpen}
          />
        }
        bar={<BottomBar view={view} weekly={state.fase === "pre" && state.semanal} onSend={onRequestSend} />}
      />

      {failureItem && (
        <FailureModal
          item={failureItem}
          previous={state.resp[failureItem.id]}
          onCancel={() => setFailureItem(null)}
          onSave={(response) => {
            inspection.saveFailure(failureItem, response);
            setFailureItem(null);
          }}
        />
      )}

      {readingOpen && (
        <KeypadModal
          reading={readingOpen}
          current={state.lect[readingOpen.k]}
          validate={(v) => inspection.validate(readingOpen, v)}
          onCancel={() => setReadingOpen(null)}
          onSave={(value) => {
            inspection.setReading(readingOpen.k, value);
            setReadingOpen(null);
          }}
        />
      )}
    </>
  );
}
