import QRCode from "qrcode";

/** PNG buffer encoding the full public guest feedback URL (print-friendly size). */
export async function renderQrPngBuffer(
  publicFeedbackUrl: string,
): Promise<Buffer> {
  return QRCode.toBuffer(publicFeedbackUrl, {
    type: "png",
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}
