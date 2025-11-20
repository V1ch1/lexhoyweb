"use client";

import { UserProfile } from "@clerk/nextjs";

export default function CuentaClerkPage() {
  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Mi Cuenta
        </h1>
        <p className="text-lg text-gray-600">
          Administra tu perfil, seguridad y sesiones activas
        </p>
      </div>

      {/* UserProfile Component */}
      <div className="flex justify-center">
        <UserProfile
          path="/dashboard/settings/cuenta"
          routing="path"
          appearance={{
            variables: {
              colorPrimary: "#E04040",
              colorBackground: "#ffffff",
              colorText: "#111827",
              colorTextSecondary: "#6B7280",
              colorInputBackground: "#ffffff",
              colorInputText: "#111827",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-work-sans), sans-serif",
            },
            elements: {
              rootBox: "w-full max-w-5xl",
              card: "shadow-sm border border-gray-100 rounded-xl",
              navbar: "bg-white border-b border-gray-200",
              navbarButton:
                "text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors",
              navbarButtonActive: "text-primary bg-gray-50",
              pageScrollBox: "bg-gray-50",
              page: "bg-white rounded-xl shadow-sm border border-gray-100 p-6",
              formButtonPrimary:
                "bg-primary hover:bg-red-600 text-white font-medium transition-colors rounded-lg",
              formButtonReset:
                "text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors",
              formFieldLabel: "text-gray-700 font-medium",
              formFieldInput:
                "border-gray-300 focus:border-primary focus:ring-primary rounded-lg",
              headerTitle: "text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600",
              profileSectionTitle: "text-xl font-semibold text-gray-900",
              profileSectionContent: "text-gray-700",
              badge: "bg-blue-100 text-blue-800 rounded-full",
              avatarBox: "border-4 border-primary",
            },
          }}
        />
      </div>
    </div>
  );
}
