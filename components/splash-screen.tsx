"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"

interface SplashScreenProps {
  onDismiss: () => void
}

export function SplashScreen({ onDismiss }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center max-w-[390px] w-full space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/lsf-branding/LSF_Lion_Logo_Dark.png"
            alt="LSF Logo"
            width={120}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        {/* Personalized Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">
            Designed Exclusively For
          </h1>
          <p className="text-xl font-bold uppercase tracking-wide text-primary">
            Leonard Selvaraja Fernando
          </p>
        </div>

        {/* Features List */}
        <div className="w-full space-y-4 border-t-2 border-primary/20 pt-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground text-center mb-4">
            Features
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-primary font-black text-lg leading-none">•</span>
              <p className="text-xs font-bold uppercase tracking-tight text-foreground flex-1">
                Today&apos;s meal schedule
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-black text-lg leading-none">•</span>
              <p className="text-xs font-bold uppercase tracking-tight text-foreground flex-1">
                Weekly meal planning with smart guardrails
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-black text-lg leading-none">•</span>
              <p className="text-xs font-bold uppercase tracking-tight text-foreground flex-1">
                Dish library management
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-black text-lg leading-none">•</span>
              <p className="text-xs font-bold uppercase tracking-tight text-foreground flex-1">
                Automated grocery list generation
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-black text-lg leading-none">•</span>
              <p className="text-xs font-bold uppercase tracking-tight text-foreground flex-1">
                Settings & customization
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Fork Message */}
        <div className="w-full border-t-2 border-primary/20 pt-6 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
            Want to fork this app?
          </p>
          <a
            href="https://github.com/ifly-leonard/DietOS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide text-primary hover:opacity-80 transition-opacity"
          >
            <span>View on GitHub</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="w-full bg-primary text-primary-foreground py-4 px-6 font-black uppercase tracking-widest text-sm hover:opacity-90 transition-opacity border-2 border-primary"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

