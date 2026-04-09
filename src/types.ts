export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface Patient {
  id?: string;
  name: string;
  bloodGroup: BloodGroup;
  disease: string;
  contact: string;
  address: string;
  uid: string;
}

export interface Donor {
  id?: string;
  name: string;
  bloodGroup: BloodGroup;
  medicalReport: string;
  address: string;
  contact: string;
  uid: string;
  lastDonationDate?: string;
}

export interface BloodBank {
  id?: string;
  name: string;
  address: string;
  contact: string;
  inventory: Record<BloodGroup, number>;
  managerUid: string;
}

export interface Donation {
  id?: string;
  donorId: string;
  donorName?: string;
  bloodBankId: string;
  bloodBankName?: string;
  date: string;
  units: number;
  status: "pending" | "completed" | "rejected";
  bloodGroup: BloodGroup;
}

export interface BloodRequest {
  id?: string;
  patientId: string;
  patientName?: string;
  bloodBankId: string;
  bloodBankName?: string;
  bloodGroup: BloodGroup;
  units: number;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  date: string;
}
