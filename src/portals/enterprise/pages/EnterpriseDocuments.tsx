/**
 * Enterprise — Documents & Files page.
 */

import { PageHeader, MediaManager } from "@/core/components";

export default function EnterpriseDocuments() {
  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Project Documents & Files"
        title_ar="مستندات ومرفقات المشاريع"
        description_en="Upload and manage project documents, assets, and deliverables"
        description_ar="ارفع وأدر مستندات المشاريع والأصول والمخرجات"
      />

      <MediaManager
        bucket="media"
        folder="delivery"
        maxFiles={20}
        allowedTypes={["image/", "application/pdf", "application/", "text/"]}
      />
    </div>
  );
}
