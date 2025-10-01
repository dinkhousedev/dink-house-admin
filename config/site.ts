export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Dink House Admin",
  description:
    "Operational dashboard for the Dink House pickleball experience.",
  navItems: [
    {
      label: "Dashboard",
      href: "/",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/",
    },
    {
      label: "Contact Inquiries",
      href: "/contact-inquiries",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/dink-house",
    twitter: "https://twitter.com/dinkhouse",
    docs: "https://dink.house",
    discord: "https://discord.gg/dinkhouse",
    sponsor: "https://patreon.com/dinkhouse",
  },
};
