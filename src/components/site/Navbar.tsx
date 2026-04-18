"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const hideLogoPages = ["/events", "/whatson"];
  const hideLogo = hideLogoPages.includes(pathname);

  return (
    <nav className="site-navbar">
      {/* Navigation Links */}
      <div className="site-nav-links">
        <Link href="/" className="site-nav-link">Home</Link>
        <span className="text-gold">•</span>
        <Link href="/whatson" className="site-nav-link">What&apos;s On</Link>
        <span className="text-gold">•</span>
        <a href="https://bce3rd-eu.myshopify.com/" target="_blank" rel="noopener noreferrer" className="site-nav-link">Merchandise</a>
        <span className="text-gold">•</span>
        <Link href="/bookdillon" className="site-nav-link">Book Dillon</Link>
        <span className="text-gold">•</span>
        <Link href="/whisky-list" className="site-nav-link">Whisky List</Link>
        <span className="text-gold">•</span>
        <Link href="/drinks" className="site-nav-link">Drinks Menu</Link>
      </div>

      {/* Logo Container - HIDDEN ON EVENTS/WHATSON PAGES */}
      {!hideLogo && (
        <div>
          <Link href="/">
            <Image
              src="/images/dillon-logo.png"
              alt="DILLON"
              width={500}
              height={500}
              className="site-logo"
              priority
            />
          </Link>
        </div>
      )}
    </nav>
  );
}

