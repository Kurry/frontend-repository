import "./webmcp";
import { ReconstructionTable } from "./ReconstructionTable";
import { EdgeMicroscope } from "./EdgeMicroscope";
import { EvidenceLedger } from "./EvidenceLedger";
import { ProfileView } from "./ProfileView";
import { HistoryControl } from "./HistoryControl";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-bold font-mono">Ceramic Sherd Reconstruction Studio</h1>
        <ReconstructionTable />
      </div>
      <div className="w-full md:w-[400px] flex flex-col gap-4 shrink-0">
        <EdgeMicroscope />
        <ProfileView />
        <HistoryControl />
        <EvidenceLedger />
      </div>
    </div>
  );
}
