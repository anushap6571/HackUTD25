import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export const Map = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-auto">
        </main>
      </div>
    </div>
  );
};
