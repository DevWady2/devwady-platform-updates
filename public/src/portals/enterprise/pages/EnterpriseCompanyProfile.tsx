/**
 * Enterprise — Company Profile Edit page.
 * Post-onboarding company profile management reusing the existing company_profiles model.
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Building2, Upload, Loader2, Save, Globe, Mail, Phone, MapPin, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "E-commerce",
  "Real Estate", "Manufacturing", "Media", "Consulting", "Logistics", "Retail", "Other",
];
const employeeCounts = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function EnterpriseCompanyProfile() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { upload, uploading } = useMediaUpload();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [otherUrl, setOtherUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setCompanyName(data.company_name || "");
        setDescription(data.description || "");
        setIndustry(data.industry || "");
        setWebsite(data.website || "");
        setLocation(data.location || "");
        setContactEmail(data.contact_email || user.email || "");
        setContactPhone(data.contact_phone || "");
        setEmployeeCount(data.employee_count || "");
        setFoundedYear(data.founded_year?.toString() || "");
        setLogoUrl(data.logo_url || "");
        setTagline(data.tagline || "");
        const sl = (data.social_links as Record<string, string>) || {};
        setLinkedinUrl(sl.linkedin || "");
        setTwitterUrl(sl.twitter || "");
        setOtherUrl(sl.other || "");
      } else {
        setContactEmail(user.email || "");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = await upload(file, `${user.id}`);
    if (url) setLogoUrl(url);
  };

  const handleSave = async () => {
    if (!user || !companyName.trim()) return;
    setSaving(true);
    const socialLinks: Record<string, string> = {};
    if (linkedinUrl.trim()) socialLinks.linkedin = linkedinUrl.trim();
    if (twitterUrl.trim()) socialLinks.twitter = twitterUrl.trim();
    if (otherUrl.trim()) socialLinks.other = otherUrl.trim();

    const payload = {
      company_name: companyName,
      description,
      industry,
      website,
      location,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      employee_count: employeeCount,
      founded_year: foundedYear ? parseInt(foundedYear) : null,
      logo_url: logoUrl || null,
      tagline: tagline || null,
      social_links: socialLinks,
    };

    const { data: existing } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("company_profiles").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("company_profiles").insert({ ...payload, user_id: user.id }));
    }

    setSaving(false);
    if (error) {
      toast.error(isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save profile");
    } else {
      toast.success(isAr ? "تم حفظ الملف بنجاح" : "Company profile saved");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title_en="Company Profile"
          title_ar="ملف الشركة"
          description_en="Manage your company information and branding"
          description_ar="حدّث معلومات شركتك والعلامة التجارية"
        />
        <Button onClick={handleSave} disabled={saving || !companyName.trim()} className="rounded-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
          {isAr ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Brand & Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {isAr ? "الهوية والعلامة التجارية" : "Brand & Identity"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">{isAr ? "شعار الشركة" : "Company Logo"}</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "تغيير الشعار" : "Change logo")}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{isAr ? "اسم الشركة" : "Company Name"}</label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{isAr ? "شعار مختصر" : "Tagline"}</label>
              <Input value={tagline} onChange={e => setTagline(e.target.value.slice(0, 100))} maxLength={100} />
              <p className="text-xs text-muted-foreground mt-1">{tagline.length}/100</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{isAr ? "المجال" : "Industry"}</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر المجال" : "Select industry"} /></SelectTrigger>
                <SelectContent>
                  {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{isAr ? "عن الشركة" : "Description"}</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {isAr ? "التواصل والتفاصيل" : "Contact & Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {isAr ? "البريد الإلكتروني" : "Contact Email"}
              </label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} type="email" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {isAr ? "الهاتف" : "Phone"}
              </label>
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {isAr ? "الموقع الإلكتروني" : "Website"}
              </label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {isAr ? "الموقع" : "Location"}
              </label>
              <Input value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {isAr ? "حجم الشركة" : "Company Size"}
                </label>
                <Select value={employeeCount} onValueChange={setEmployeeCount}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    {employeeCounts.map(c => <SelectItem key={c} value={c}>{c} {isAr ? "موظف" : "employees"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isAr ? "سنة التأسيس" : "Founded Year"}</label>
                <Input value={foundedYear} onChange={e => setFoundedYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2020" maxLength={4} />
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-3">{isAr ? "الروابط الاجتماعية" : "Social Links"}</p>
              <div className="space-y-3">
                <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" />
                <Input value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="Twitter / X URL" />
                <Input value={otherUrl} onChange={e => setOtherUrl(e.target.value)} placeholder={isAr ? "رابط آخر" : "Other URL"} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
