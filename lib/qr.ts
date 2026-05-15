import QRCode from "qrcode";

export async function qrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function qrSvgString(text: string): Promise<string> {
  return await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
}
