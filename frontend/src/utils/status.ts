export type RecordStatus = "draft" | "submitted" | "not_created";

export function statusLabel(status: RecordStatus): string {
  switch (status) {
    case "draft":
      return "草稿状态";
    case "submitted":
      return "已提交状态";
    case "not_created":
      return "未填写状态";
  }
}

export function statusTagColor(status: RecordStatus): string {
  switch (status) {
    case "submitted":
      return "green";
    case "draft":
      return "blue";
    case "not_created":
      return "default";
  }
}

