import { EXTERNAL_LINK, SOCIAL } from "@/lib/social";
import Image from "next/image";
import styles from "./navigation.module.css";

/** Shared Instagram link used by the header, mobile menu, and page rails. */
export default function InstagramLink({ className = "" }: { className?: string }) {
  return <a href={SOCIAL.instagram} {...EXTERNAL_LINK} aria-label="FORMAT en Instagram"
    className={`${styles.instagram} ${className}`}>
    <span className={styles.instagramIcon} aria-hidden>
      <Image
        src="/logos/logo-instagram-format.svg"
        alt=""
        width={72}
        height={48}
        unoptimized
      />
    </span>
    <span className={styles.instagramLabel}>Instagram</span>
  </a>;
}
