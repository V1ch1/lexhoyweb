"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { UserProfile } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import NotificationsTab from "@/components/settings/NotificationsTab";
import PrivacyTab from "@/components/settings/PrivacyTab";

// Types
type SettingsSection =
  | "overview"
  | "account"
  | "notifications"
  | "privacy";

interface SettingsCard {
  id: SettingsSection;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  visible: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("overview");
  const [currentHash, setCurrentHash] = useState("");

  // Detectar hash en la URL y cambiar sección activa
  useEffect(() => {
    // Mapear hashes a secciones
    const hashToSection: Record<string, SettingsSection> = {
      cuenta: "account",
      account: "account",
      notificaciones: "notifications",
      notifications: "notifications",
      privacidad: "privacy",
      privacy: "privacy",
    };

    const updateSection = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hashToSection[hash]) {
        setActiveSection(hashToSection[hash]);
        setCurrentHash(hash);
      } else {
        setActiveSection("overview");
        setCurrentHash("");
      }
    };

    // Ejecutar al montar y cada vez que cambie la URL
    updateSection();

    // Escuchar cambios en el hash
    const handleHashChange = () => {
      updateSection();
    };

    // Polling para detectar cambios (fallback)
    const interval = setInterval(() => {
      const hash = window.location.hash.replace("#", "");
      if (hash !== currentHash) {
        updateSection();
      }
    }, 100);

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      clearInterval(interval);
    };
  }, [currentHash]);

  // Settings cards configuration
  const settingsCards: SettingsCard[] = [
    {
      id: "account",
      name: "Cuenta",
      description: "Gestiona tu perfil, contraseña y sesiones",
      icon: UserCircleIcon,
      color: "blue",
      visible: true,
    },
    {
      id: "notifications",
      name: "Notificaciones",
      description: "Gestiona tus preferencias de notificaciones",
      icon: BellIcon,
      color: "yellow",
      visible: true,
    },
    {
      id: "privacy",
      name: "Privacidad",
      description: "Controla tu privacidad y datos",
      icon: ShieldCheckIcon,
      color: "red",
      visible: true,
    },
  ];

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="w-full">
            <UserProfile
              appearance={{
                variables: {
                  colorPrimary: "#E04040",
                },
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 w-full",
                },
              }}
            />
          </div>
        );
      case "notifications":
        return (
          <NotificationsTab
            loading={false}
            notifications={{
              email_nuevos_leads: false,
              email_actualizaciones: false,
              email_sistema: false,
              push_leads: false,
              push_mensajes: false,
            }}
            onUpdate={() => {}}
            onSubmit={() => {}}
          />
        );
      case "privacy":
        return <PrivacyTab loading={false} />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">
            Por favor, inicia sesión para acceder a la configuración.
          </p>
        </div>
      </div>
    );
  }

  // Settings Card Component
  const SettingsCardComponent = ({
    card,
    onClick,
  }: {
    card: SettingsCard;
    onClick: () => void;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      green: "bg-green-50 text-green-600 hover:bg-green-100",
      purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
      yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
      red: "bg-red-50 text-red-600 hover:bg-red-100",
    };

    return (
      <button
        onClick={onClick}
        className={`${colorClasses[card.color as keyof typeof colorClasses]} w-full p-6 rounded-xl transition-all duration-200 hover:shadow-md text-left group`}
      >
        <card.icon className="h-8 w-8 mb-3" />
        <h3 className="text-lg font-semibold mb-1">{card.name}</h3>
        <p className="text-sm opacity-80">{card.description}</p>
        <ArrowRightIcon className="h-5 w-5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {activeSection === "overview"
            ? "Configuración"
            : settingsCards.find((c) => c.id === activeSection)?.name ||
              "Configuración"}
        </h1>
        <p className="text-lg text-gray-600">
          {activeSection === "overview"
            ? "Gestiona tu perfil, seguridad y preferencias de la cuenta"
            : settingsCards.find((c) => c.id === activeSection)?.description ||
              ""}
        </p>

        {/* Breadcrumb */}
        {activeSection !== "overview" && (
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a configuración
          </button>
        )}
      </div>

      {activeSection === "overview" ? (
        <>
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mr-4">
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2) || "U"}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded">
                  {user.role === "super_admin"
                    ? "Super Admin"
                    : user.role === "despacho_admin"
                      ? "Despacho Admin"
                      : "Usuario"}
                </span>
              </div>
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsCards
              .filter((card) => card.visible)
              .map((card) => {
                // Mapear IDs de sección a hashes en español
                const sectionToHash: Record<SettingsSection, string> = {
                  overview: "",
                  account: "cuenta",
                  notifications: "notificaciones",
                  privacy: "privacidad",
                };

                return (
                  <SettingsCardComponent
                    key={card.id}
                    card={card}
                    onClick={() =>
                      router.push(
                        `/dashboard/settings#${sectionToHash[card.id]}`
                      )
                    }
                  />
                );
              })}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">{renderSectionContent()}</div>
        </div>
      )}
    </div>
  );
}
