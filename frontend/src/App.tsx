import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app/AppShell";
import { HomePage } from "./pages/Home/HomePage";
import { ChallengeListingPage } from "./pages/ChallengeListing/ChallengeListingPage";
import { ChallengeDescriptionPage } from "./pages/ChallengeDescription/ChallengeDescriptionPage";
import { BuilderPage } from "./pages/DragDropBuilder/BuilderPage";
import { SimulationPage } from "./pages/Simulation/SimulationPage";
import { ResultPage } from "./pages/ScoreResult/ResultPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
<<<<<<< HEAD
import { OptimizersPage } from "./pages/Optimizers/OptimizersPage";
=======
import { OptimizerChallengePage } from "./pages/OptimizerChallengePage";
// @ts-ignore The parallel p5 mini-game is intentionally kept as a plain JSX module.
import PhysicsOptimizer from "./pages/PhysicsOptimizer.jsx";
>>>>>>> origin/main

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
          <Route path="/optimizer/:challengeId" element={<OptimizerChallengePage />} />
          <Route path="/physics-optimizer/:challengeId" element={<PhysicsOptimizer />} />
          <Route path="/simulate/:challengeId" element={<SimulationPage />} />
          <Route path="/result/:challengeId" element={<ResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
