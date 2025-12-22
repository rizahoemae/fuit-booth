"use client";

import { useState } from "react";

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 p-3 bg-secondary w-full justify-between flex text-gray-400">
      <div></div>
      <p>
        Made with 💗 by{" "}
        <a
          href="https://fuitgummies.framer.website/"
          target="_blank"
          className="text-primary"
        >
          @fuitgummies.id
        </a>
      </p>
      <p className="text-gray-400">v1.0</p>
    </nav>
  );
}
