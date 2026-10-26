import { useEffect, useRef, useState } from "react";
import { STAGES } from "../../data/stages";
import type { ExtractionController } from "../../hooks/useExtraction";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useToast } from "../../hooks/useToast";
import type { useSyncQueue } from "../../hooks/useSyncQueue";
import { pointInPolygon } from "../../lib/geo";
import { buildExtractionRecord } from "../../lib/records";
import { ExtractionScene } from "../../three/ExtractionScene";
import { useScene } from "../../three/useScene";
import type { Gps, Operator, Session } from "../../types";
import { NoteModal } from "../modals/NoteModal";
import { CameraTools } from "../ui/CameraTools";
import { SceneHost } from "../ui/SceneHost";
import { OVERLAY_QUERY, StageLayout } from "../layout/StageLayout";
import { ExtractionPanel } from "./ExtractionPanel";
import { MaterialBar } from "./MaterialBar";

interface ExtractionViewProps {
  extraction: ExtractionController;
  session: Session;
  operator: Operator;
  gps: Gps | null;
  sync: Pick<ReturnType<typeof useSyncQueue>, "submit">;
  haptic: (kind?: "ok" | "tap") => void;
}

/** Pestaña de extracción: fila 3D de materiales, contador de baldes y registro del tramo. */
export function ExtractionView({ extraction, session, operator, gps, sync, haptic }: ExtractionViewProps) {
  const { state } = extraction;
  const toast = useToast();
  const stage = STAGES[state.sel];
  const capacity = session.maq.capacidad_balde_m3 || 0;

  const [noteOpen, setNoteOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [lastRegistered, setLastRegistered] = useState("");
  const warnedOutside = useRef(false);

  const { hostRef, sceneRef } = useScene(() => new ExtractionScene(state.sel));

  const select = (i: number) => {
    const result = extraction.select(i);
    if (result === "cancelled") return;
    if (result === "changed") {
      sceneRef.current?.select(i);
      haptic();
    }
    sceneRef.current?.emit(12);
  };

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.onPick = select;
  });

  // el panel solo tapa la escena cuando flota encima (lg+); apilado, la cámara mira al centro
  const panelOverScene = useMediaQuery(OVERLAY_QUERY);
  useEffect(() => {
    sceneRef.current?.setPanelOverScene(panelOverScene);
  }, [panelOverScene, sceneRef]);

  const addBuckets = (n: number) => {
    extraction.addBuckets(n);
    if (n > 0) sceneRef.current?.emit(n === 1 ? 6 : 10);
  };

  const register = async () => {
    if (state.baldes <= 0) return;
    const zone = session.zone;
    if (zone?.poligono && gps && !warnedOutside.current && pointInPolygon(gps.lat, gps.lon, zone.poligono) === false) {
      warnedOutside.current = true; // se avisa una vez, no se bloquea el turno
      return toast(`El GPS no está dentro de ${zone.nombre}. Verifique el frente y vuelva a tocar Registrar.`);
    }

    const m3 = (state.baldes * capacity).toFixed(1);
    const summary = `${stage.n} · ${state.baldes} baldes · ${m3} m³`;
    setRegistering(true);
    const outcome = await sync.submit(buildExtractionRecord({ state, session, operator, gps }));

    if (outcome.status === "failed") {
      setRegistering(false);
      toast("⚠ NO SE PUDO GUARDAR en la tablet. No cierre la app: avise al supervisor y reintente."); // los baldes siguen en pantalla
      return;
    }
    // quedó guardado en la tablet; el envío sigue solo en segundo plano (el indicador muestra los pendientes)
    setLastRegistered(`Guardado: ${summary} · ${new Date().toLocaleTimeString()}`);
    toast(`Guardado: ${m3} m³ de ${stage.n}.`);
    haptic("ok");
    extraction.afterRegistered();
    setRegistering(false);
  };

  return (
    <>
      <StageLayout
        panelFit
        scene={<SceneHost hostRef={hostRef} />}
        tools={
          <CameraTools
            onZoomIn={() => sceneRef.current?.zoom(0.88)}
            onZoomOut={() => sceneRef.current?.zoom(1.13)}
            onReset={() => sceneRef.current?.reset()}
            onNote={() => setNoteOpen(true)}
          />
        }
        panel={
          <ExtractionPanel
            stage={stage}
            buckets={state.baldes}
            bucketCapacity={capacity}
            lastRegistered={lastRegistered}
            registering={registering}
            onIncrement={() => addBuckets(1)}
            onDecrement={() => addBuckets(-1)}
            onQuickAdd={(n) => (n === 0 ? extraction.clearBuckets() : addBuckets(n))}
            onRegister={register}
          />
        }
        bar={<MaterialBar selected={state.sel} onSelect={select} />}
      />

      {noteOpen && (
        <NoteModal
          initial={state.nota}
          onCancel={() => setNoteOpen(false)}
          onSave={(note) => {
            extraction.setNote(note);
            setNoteOpen(false);
            toast(note ? "Nota guardada para el próximo registro." : "Nota borrada.");
          }}
        />
      )}
    </>
  );
}
