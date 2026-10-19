export type Contact = {
  id: string;
  label: string;
  phone?: string;
  hours?: string;
  personName?: string;
  location?: string;
  sourceUrl?: string;
};

export type Contacts = Readonly<Record<string, Contact | undefined>>;

export type ContactDirectoryEntry = {
  contactId: string;
  title: string;
  category: string;
  guidance: string;
  note?: string;
};
