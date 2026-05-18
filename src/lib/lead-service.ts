import { supabase } from "@/integrations/supabase/client";

export interface StudentLead {
  id?: string;
  fullName: string;
  phone: string;
  marks?: number;
  pucPercentage?: number;
  predictedRank?: number;
  createdAt?: string;
}

const LEAD_SESSION_KEY = "rankpredictor_user_session";

export const LeadService = {
  // Check if user is verified and logged in
  isLoggedIn(): boolean {
    return localStorage.getItem(LEAD_SESSION_KEY) !== null;
  },

  // Get current logged-in lead profile
  getCurrentUser(): StudentLead | null {
    const session = localStorage.getItem(LEAD_SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session) as StudentLead;
    } catch {
      return null;
    }
  },

  // Log in user with name and phone number
  login(fullName: string, phone: string): StudentLead {
    const lead: StudentLead = {
      fullName,
      phone,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(LEAD_SESSION_KEY, JSON.stringify(lead));
    
    // Save to Supabase asynchronously
    this.syncLeadWithSupabase(lead);
    
    return lead;
  },

  // Log out user
  logout() {
    localStorage.removeItem(LEAD_SESSION_KEY);
  },

  // Save predicted rank results to lead profile and sync with database
  async updateLeadPrediction(marks: number, pucPercentage: number, predictedRank: number) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    currentUser.marks = marks;
    currentUser.pucPercentage = pucPercentage;
    currentUser.predictedRank = predictedRank;

    // Save locally
    localStorage.setItem(LEAD_SESSION_KEY, JSON.stringify(currentUser));

    // Sync with database
    await this.syncLeadWithSupabase(currentUser);
  },

  // Save guest lead to Supabase users table (guest leads)
  async syncLeadWithSupabase(lead: StudentLead) {
    try {
      if (!supabase) return;

      // Check if user table exists by doing an upsert or insert
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            full_name: lead.fullName,
            phone: lead.phone,
            marks: lead.marks || null,
            expected_rank: lead.predictedRank || null,
            expected_rank_max: lead.predictedRank ? Math.round(lead.predictedRank * 1.1) : null,
            created_at: lead.createdAt || new Date().toISOString()
          }
        ]);

      if (error) {
        // Table structure may be different or in setup, log it silently
        console.warn("Supabase lead syncing offline/initializing. Stored locally.", error.message);
      }
    } catch (e) {
      console.warn("Supabase sync bypass:", e);
    }
  }
};
