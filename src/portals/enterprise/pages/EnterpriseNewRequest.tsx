/**
 * Enterprise — New Service Request form.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { SERVICE_TYPES, BUDGET_RANGES, TIMELINES } from "../constants";

export default function EnterpriseNewRequest() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    service_type: "",
    category: "project" as "project" | "service",
    description: "",
    requirements: "",
    budget_range: "",
    timeline: "",
    preferred_start_date: "",
    contact_name: "",
    contact_email: user?.email ?? "",
    contact_phone: "",
    company_name: "",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title || !form.service_type || !form.description || !form.contact_name || !form.contact_email) {
      toast.error(isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("service_requests").insert({
      title: form.title,
      service_type: form.service_type,
      category: form.category,
      description: form.description,
      requirements: form.requirements || null,
      budget_range: form.budget_range || null,
      timeline: form.timeline || null,
      preferred_start_date: form.preferred_start_date || null,
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone || null,
      company_name: form.company_name || null,
      user_id: user?.id ?? null,
      source: "delivery_portal",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? "تم إرسال طلبك بنجاح" : "Request submitted successfully");
      navigate("/enterprise/portal/requests");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title_en="New Project Request"
        title_ar="طلب مشروع جديد"
        description_en="Tell us about your project or service needs"
        description_ar="أخبرنا عن مشروعك أو احتياجاتك"
        actions={
          <Link to="/enterprise/portal">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 me-1 icon-flip-rtl" />
              {isAr ? "رجوع" : "Back"}
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "معلومات المشروع" : "Project Information"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isAr ? "عنوان المشروع" : "Project Title"} *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder={isAr ? "مثال: تطبيق إدارة المطاعم" : "e.g. Restaurant Management App"} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "نوع الخدمة" : "Service Type"} *</Label>
                <Select value={form.service_type} onValueChange={(v) => set("service_type", v)}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "التصنيف" : "Category"}</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">{isAr ? "مشروع" : "Project"}</SelectItem>
                    <SelectItem value="service">{isAr ? "خدمة" : "Service"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "وصف المشروع" : "Project Description"} *</Label>
              <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={isAr ? "صِف مشروعك بالتفصيل..." : "Describe your project in detail..."} />
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "المتطلبات التقنية" : "Technical Requirements"}</Label>
              <Textarea rows={3} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder={isAr ? "أي متطلبات تقنية محددة..." : "Any specific technical requirements..."} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "الميزانية والجدول" : "Budget & Timeline"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "نطاق الميزانية" : "Budget Range"}</Label>
                <Select value={form.budget_range} onValueChange={(v) => set("budget_range", v)}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{isAr ? b.ar : b.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "الجدول الزمني" : "Timeline"}</Label>
                <Select value={form.timeline} onValueChange={(v) => set("timeline", v)}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "تاريخ البدء المفضل" : "Preferred Start Date"}</Label>
              <Input type="date" value={form.preferred_start_date} onChange={(e) => set("preferred_start_date", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "معلومات التواصل" : "Contact Information"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "الاسم" : "Full Name"} *</Label>
                <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "اسم الشركة" : "Company Name"}</Label>
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Send className="h-4 w-4 me-2" />}
          {isAr ? "إرسال الطلب" : "Submit Request"}
        </Button>
      </form>
    </div>
  );
}
