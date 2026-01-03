import { IconClipboardList, IconPlus } from "@tabler/icons-react";

const complaints = {
  id: "complaints",
  title: "Complaints",
  type: "group",
  children: [
    {
      id: "submit-complaint",
      title: "Submit Complaint",
      type: "item",
      url: "/submit-complaint",
      icon: IconPlus,
      breadcrumbs: false
    },
    {
      id: "view-complaint",
      title: "View Complaints",
      type: "item",
      url: "/view-complaint",
      icon: IconClipboardList,
      breadcrumbs: false
    }
  ]
};

export default complaints;
