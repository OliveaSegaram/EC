export type Issue = {
  id: number;
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string;
  status: string;
  submittedAt: string;
  attachment: string | null;
  underWarranty: boolean;
  comment?: string;
  dcRejectionReason?: string;
  approvalComment?: string;
  branch?: string;
  district?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    username: string;
    email: string;
    districtId?: number;
    branch?: string;
    district?: {
      id: number;
      name: string;
    } | null;
  };
}
