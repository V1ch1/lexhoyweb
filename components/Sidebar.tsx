"use client"; // Asegúrate de que este archivo sea un componente del cliente

import Link from "next/link";
import { HomeIcon, ClipboardIcon, CogIcon } from "@heroicons/react/24/solid"; // Usando ClipboardIcon

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-semibold mb-6">LexHoy Leads</h2>
        <ul>
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
            >
              <HomeIcon className="h-5 w-5" />
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/leads"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
            >
              <ClipboardIcon className="h-5 w-5" />
              Leads
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
            >
              <CogIcon className="h-5 w-5" />
              Settings
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
