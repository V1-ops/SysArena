import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app/AppShell";
import { HomePage } from "./pages/Home/HomePage";
import { ChallengeListingPage } from "./pages/ChallengeListing/ChallengeListingPage";
import { ChallengeDescriptionPage } from "./pages/ChallengeDescription/ChallengeDescriptionPage";
import { BuilderPage } from "./pages/DragDropBuilder/BuilderPage";
import { SimulationPage } from "./pages/Simulation/SimulationPage";
import { ResultPage } from "./pages/ScoreResult/ResultPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { OptimizersPage } from "./pages/Optimizers/OptimizersPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/challenges" element={<ChallengeListingPage />} />
          <Route path="/optimizers" element={<OptimizersPage />} />
          <Route path="/challenge/:challengeId" element={<ChallengeDescriptionPage />} />
          <Route path="/build/:challengeId" element={<BuilderPage />} />
          <Route path="/simulate/:challengeId" element={<SimulationPage />} />
          <Route path="/result/:challengeId" element={<ResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
