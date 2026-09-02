export const downloadApiFile = async (api, url, params, filename) => {
  const response = await api.get(url, { params, responseType: "blob" });
  const contentType = response.headers?.["content-type"] || "";

  if (contentType.includes("application/json")) {
    const text = await response.data.text();
    const payload = JSON.parse(text);
    throw new Error(payload?.message || "Export failed");
  }

  const blob = new Blob([response.data], { type: contentType || "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};
