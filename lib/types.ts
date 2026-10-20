export type EventRow = {
  id: string;
  kind: "event" | "notice";
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  published: boolean;
};

export type Member = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  profession: string | null;
  blood_group: string | null;
  last_blood_donation: string | null;
  show_in_blood_list: boolean;
  monthly_fee: number;
  status: "pending" | "active" | "inactive";
  joined_on: string;
};

export type Payment = {
  id: string;
  member_id: string;
  month: string;
  amount: number;
  paid_on: string;
  method: string;
  note: string | null;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  spent_on: string;
  category: string | null;
  note: string | null;
};

export type Donation = {
  id: string;
  donor_name: string;
  amount: number;
  received_on: string;
  purpose: string | null;
};

export type PublicStats = {
  members: number;
  donors: number;
  events: number;
  income: number;
  expense: number;
};
