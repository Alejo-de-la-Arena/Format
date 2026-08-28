import { EXTERNAL_LINK, SOCIAL } from "@/lib/social";
import styles from "./navigation.module.css";

/** Shared social control: outlined badge, deliberately distinct from title tape. */
export default function InstagramLink({ className = "" }: { className?: string }) {
  return <a href={SOCIAL.instagram} {...EXTERNAL_LINK} aria-label="FORMAT en Instagram"
    className={`${styles.instagram} ${className}`}>
    <span className={styles.instagramIcon} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
      </svg>
    </span>
    <span>Instagram</span><span className={styles.external} aria-hidden>↗</span>
  </a>;
}
