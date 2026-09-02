import gooseLogoUrl from "../assets/gooselogo.png";

export type CricketBackgroundLogoId = "none" | "wedart" | "goose" | "custom";

export interface CricketBackgroundLogoOption {
  id: Exclude<CricketBackgroundLogoId, "custom">;
  name: string;
  src: string;
}

export const cricketBackgroundLogoOptions: CricketBackgroundLogoOption[] = [
  {
    id: "none",
    name: "None",
    src: "",
  },
  {
    id: "wedart",
    name: "WeDart",
    src: "/favicon.svg",
  },
  {
    id: "goose",
    name: "Goose Dart Team",
    src: gooseLogoUrl,
  },
];

export const CRICKET_BACKGROUND_LOGO_OPACITY = 0.08;
