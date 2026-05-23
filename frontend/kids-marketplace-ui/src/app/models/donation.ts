export interface DonationItemInput {
  name: string;
  category: string;
}

export interface Donation {
  id: string;
  userId: string;
  items: DonationItemInput[];
  note?: string | null;
  status: string;
  createdAt: string;
}

