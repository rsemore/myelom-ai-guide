import type { ReactNode } from "react";

import { Group } from "@mantine/core";
import {
  IconAddressBook,
  IconBook,
  IconChecklist,
  IconMessage,
} from "@tabler/icons-react";

import { BottomNavigationButton } from "./BottomNavigationButton";

export type NavigationSection =
  "messages" | "preparation" | "contacts" | "sources";
export type BottomNavigationProps = {
  activeSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
};

const sections: { value: NavigationSection; label: string; icon: ReactNode }[] =
  [
    { value: "messages", label: "Zprávy", icon: <IconMessage size={24} /> },
    {
      value: "preparation",
      label: "Příprava",
      icon: <IconChecklist size={24} />,
    },
    {
      value: "contacts",
      label: "Kontakty",
      icon: <IconAddressBook size={24} />,
    },
    { value: "sources", label: "Zdroje", icon: <IconBook size={24} /> },
  ];

export function BottomNavigation({
  activeSection,
  onNavigate,
}: BottomNavigationProps) {
  return (
    <Group
      component="nav"
      aria-label="Hlavní navigace"
      grow
      wrap="nowrap"
      gap="xs"
      px="xs"
      h={72}
    >
      {sections.map(({ value, label, icon }) => (
        <BottomNavigationButton
          key={value}
          icon={icon}
          label={label}
          active={value === activeSection}
          onClick={() => onNavigate(value)}
        />
      ))}
    </Group>
  );
}
