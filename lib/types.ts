export type EventRow = {
  id: string;
  kind: "event" | "notice";
  category: string;
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
  user_id: string | null;
  photo_url: string | null;
  father_name: string | null;
  dob: string | null;
  education: string | null;
  email: string | null;
  about: string | null;
  is_demo: boolean;
  hide_public?: boolean;
  created_at: string;
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
  event_id?: string | null;
};

export type Donation = {
  id: string;
  donor_name: string;
  amount: number;
  received_on: string;
  purpose: string | null;
  event_id?: string | null;
};

export type PublicStats = {
  members: number;
  donors: number;
  events: number;
  income: number;
  expense: number;
};

export type FbPost = {
  id: string;
  url: string;
  title: string | null;
  preview: string | null;
  image_url: string | null;
  posted_on: string | null;
  published: boolean;
};

export type PaymentRequest = {
  id: string;
  member_id: string;
  months: string[];
  amount: number;
  method: "bkash" | "nagad" | "rocket" | "cash";
  trx_id: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type BloodRequest = {
  id: string;
  blood_group: string;
  patient_name: string | null;
  area: string;
  hospital: string | null;
  phone: string;
  needed_on: string | null;
  note: string | null;
  status: "open" | "fulfilled";
  created_at: string;
};

export type GalleryPhoto = {
  id: string;
  album: string;
  caption: string | null;
  image_url: string;
  published: boolean;
  created_at: string;
};
