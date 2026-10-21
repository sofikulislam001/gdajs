import { redirect } from "next/navigation";

// "আমার বকেয়া" এখন প্রোফাইল পেজেই (লগইন করে দেখতে হয়)
export default function DuesPage() {
  redirect("/profile");
}
