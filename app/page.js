"use client";

import { useState } from "react";
import Header from "../components/Header";
import HeroSection from "../components/home/HeroSection";
import SetupCard from "../components/home/SetupCard";
import ColorPaletteSection from "../components/home/ColorPaletteSection";
import FeaturesSection from "../components/home/FeaturesSection";
import Footer from "../components/home/Footer";

export default function HomePage() {
  const [playerCount, setPlayerCount] = useState(2);
  const [mode, setMode] = useState("offline");

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HeroSection mode={mode} setMode={setMode} />
        <SetupCard playerCount={playerCount} setPlayerCount={setPlayerCount} />
        <ColorPaletteSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
