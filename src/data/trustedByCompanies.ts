export interface TrustedByCompany {
  name: string;
  img: string;
  font?: string;
}

export interface TrustedByItem {
  id: string;
  name: string;
  img: string;
  font?: string;
}
export const additionalTrustedByCompanies: TrustedByCompany[] = [
  { name: 'Kingston University', img: '/companies/KingstonUniLogo.png', font: 'Limelight' },
  { name: 'NASA', img: '/companies/NASALogo.png', font: 'Saira Stencil One' },
  { name: 'ESA', img: '/companies/ESALogo.png', font: 'Abhaya Libre' },
  { name: 'KURE x Tech', img: '/companies/KURELogo.jpg', font: 'Major Mono Display' },
  { name: 'Augmented Perception', img: '/companies/APLogo.png', font: 'Moirai One' },
  { name: 'Nexus Scripture', img: '/companies/NexusScriptureLogo.jpg', font: 'Bodoni Moda' },
  { name: 'Discord', img: '/companies/DiscordLogo.png', font: 'Cherry Bomb One' },
  { name: "Youngs", img: '/companies/YoungsLogo.png', font: 'Playfair' },
];