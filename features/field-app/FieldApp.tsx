"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ExtractionView } from "./components/extraction/ExtractionView";
import { InspectionView } from "./components/inspection/InspectionView";
import { TopBar } from "./components/layout/TopBar";
import { DiagnosticsModal } from "./components/modals/DiagnosticsModal";
import { SetupModal } from "./components/modals/SetupModal";
import { SummaryModal } from "./components/modals/SummaryModal";
import { API_BASE } from "./config";
import { useCatalog } from "./hooks/useCatalog";
import { useExtraction } from "./hooks/useExtraction";
import { useGeolocation } from "./hooks/useGeolocation";
import { useInspection } from "./hooks/useInspection";
import { useSession } from "./hooks/useSession";
import { useSyncQueue } from "./hooks/useSyncQueue";
import { useTelegram } from "./hooks/useTelegram";
import { ToastProvider, useToast } from "./hooks/useToast";
import { buildInspectionRecord } from "./lib/records";
import { currentShift } from "./lib/shifts";
import { INITIAL_DIAGNOSTICS, probeStorage } from "./lib/storage/diagnostics";
import { markWeeklyDone } from "./lib/storage/meta";
import type { Tab } from "./types";

/**
 * AHV · App de campo (Telegram Mini App).
 * Una sola app con dos pestañas — INSPECCIÓN (pre/post) y EXTRACCIÓN — que comparten
 * identidad, máquina y turno, cola offline y el catálogo. Backend: ahv_api.py → Elasticsearch.
 */
export default function FieldApp() {
  return (
    <ToastProvider>
      <FieldShell />
    </ToastProvider>
  );
}

function FieldShell() {
  const toast = useToast();
  const { operator, initData, haptic } = useTelegram();
  const { gps, issue: gpsIssue } = useGeolocation();
  const { catalog, load: loadCatalog } = useCatalog(initData);
  const sessionCtl = useSession(catalog);
  const { session, ...sessionActions } = sessionCtl;
  const sync = useSyncQueue(operator, initData);

  const [booted, setBooted] = useState(false);
  const inspection = useInspection(session, booted);
  const extraction = useExtraction();

  const [tab, setTab] = useState<Tab>("inspeccion");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false); // apertura de arranque: solo se sale con "Comenzar"
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(INITIAL_DIAGNOSTICS);

  // ---------- arranque: almacenamiento → catálogo (caché y luego servidor) → borrador → cola ----------
  const boot = useEffectEvent(async () => {
    const diag = await probeStorage();
    setDiagnostics(diag);
    const cat = await loadCatalog();
    const shift = currentShift(cat.turnos); // el reloj propone; el operario decide
    if (shift) sessionActions.setShift(String(shift.numero));

    const restored = await inspection.restoreDraft();
    if (restored) {
      sessionActions.restore({ maqId: restored.machineId, turno: restored.turno, zona: restored.zona });
      if (restored.lostPhotos) {
        setTimeout(() => toast(`Se recuperó la inspección en curso, pero ${restored.lostPhotos} falla(s) perdieron la foto: vuelva a marcarlas.`), 900);
      }
    }
    setBooted(true);
    if (!restored) {
      setSetupRequired(true);
      setSetupOpen(true);
    }

    if (diag.motor !== "IndexedDB" || !diag.blobOk) {
      setTimeout(() => toast(`⚠ Esta tablet no puede guardar fotos sin red (${diag.motor}). Toque el indicador y avise a soporte.`), 1200);
    }
    await sync.refreshPending();
    void sync.flush();
    if (cat.origen === "semilla" && API_BASE) {
      setTimeout(() => toast("Trabajando con la lista de arranque: aún no se ha podido bajar el catálogo del servidor."), 2400);
    }
  });
  const bootStarted = useRef(false);
  useEffect(() => {
    if (bootStarted.current) return; // StrictMode monta dos veces en desarrollo
    bootStarted.current = true;
    void boot();
  }, []);

  // al volver la red: subir lo pendiente y refrescar el catálogo
  const onOnline = useEffectEvent(() => {
    void sync.flush({ force: true });
    void loadCatalog();
  });
  useEffect(() => {
    const handler = () => onOnline();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, []);

  // ---------- acciones ----------
  const changeTab = (t: Tab) => {
    if (t === tab) return;
    setTab(t);
    haptic();
  };

  const startShift = (includeWeekly: boolean) => {
    inspection.setWeekly(includeWeekly);
    inspection.resetSection();
    setSetupRequired(false);
    setSetupOpen(false);
  };

  const submitInspection = async ({ observations, signature }: { observations: string; signature: string }) => {
    const { state, view } = inspection;
    const outcome = await sync.submit(buildInspectionRecord({ state, view, session, operator, gps, observations, signature }));
    if (outcome.status === "failed") {
      // el resumen queda abierto: nada se pierde
      toast("⚠ NO SE PUDO GUARDAR en la tablet (sin espacio). No cierre la app: avise al supervisor y reintente Enviar.");
      return;
    }
    setSummaryOpen(false);
    if (state.fase === "pre" && state.semanal) await markWeeklyDone(session.maq.id);
    toast(`Inspección guardada en la tablet. Se enviará sola. ${view.verdict === "noapta" ? "Mantenimiento será notificado al enviarse." : ""}`);
    await inspection.startNew();
  };

  const isInspection = tab === "inspeccion";

  return (
    <div className="fixed inset-0 flex flex-col bg-canvas text-ink select-none [-webkit-tap-highlight-color:transparent] touch-manipulation">
      {/* retícula de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[repeating-linear-gradient(90deg,transparent_0_119px,rgba(0,0,0,.035)_119px_120px)]"
      />

      <TopBar
        tab={tab}
        onTabChange={changeTab}
        phase={inspection.state.fase}
        onPhaseChange={inspection.changePhase}
        session={session}
        contextLabel={isInspection ? "Zona" : "Frente"}
        contextValue={isInspection ? catalog.zonasOperativas[session.zona] : (session.zone?.nombre ?? session.titulo.nombre)}
        operator={operator}
        syncStatus={sync.status}
        pending={sync.pending}
        onOpenSetup={() => setSetupOpen(true)}
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
      />

      <div className="relative z-[1] min-h-0 flex-1">
        {isInspection ? (
          <InspectionView inspection={inspection} onRequestSend={() => setSummaryOpen(true)} haptic={haptic} />
        ) : (
          <ExtractionView extraction={extraction} session={session} operator={operator} gps={gps} sync={sync} haptic={haptic} />
        )}
      </div>

      {setupOpen && (
        <SetupModal
          catalog={catalog}
          session={session}
          actions={sessionActions}
          gps={gps}
          onStart={startShift}
          onClose={setupRequired ? undefined : () => setSetupOpen(false)}
        />
      )}

      {summaryOpen && (
        <SummaryModal
          state={inspection.state}
          view={inspection.view}
          session={session}
          catalog={catalog}
          operator={operator}
          gps={gps}
          gpsIssue={gpsIssue}
          onSubmit={submitInspection}
          onBack={() => setSummaryOpen(false)}
        />
      )}

      {diagnosticsOpen && (
        <DiagnosticsModal
          diagnostics={diagnostics}
          catalog={catalog}
          gps={gps}
          gpsIssue={gpsIssue}
          onRetry={sync.retryRejected}
          onDiscard={sync.discardRejected}
          onClose={() => setDiagnosticsOpen(false)}
          onSync={async () => {
            setDiagnosticsOpen(false);
            toast("Sincronizando…");
            await sync.flush({ force: true });
          }}
        />
      )}
    </div>
  );
}
