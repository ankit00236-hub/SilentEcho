import type { ReactNode } from 'react';
import { SessionNavigation } from './session-navigation';
import { Brand } from '../brand';
import { CosmicAtmosphere } from '../visuals/cosmic-atmosphere';

export function SiteHeader() {
  return <header className="public-header"><Brand/><nav aria-label="Main navigation"><a href="/#objective">Our objective</a><a href="/how-it-works">How it works</a><a href="/privacy">Privacy</a></nav><SessionNavigation/></header>;
}
export function SiteFooter() {
  return <footer className="public-footer"><Brand/><p>A safer space to speak. A better way to listen.</p><nav aria-label="Footer navigation"><a href="/privacy">Privacy & security</a><a href="/support">Get help</a></nav></footer>;
}
export function SiteShell({ children }: { children: ReactNode }) {
  return <CosmicAtmosphere><SiteHeader/><main className="public-main">{children}</main><SiteFooter/></CosmicAtmosphere>;
}
