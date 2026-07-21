import { QRCodeSVG } from 'qrcode.react';

interface AssetQRCodeProps {
  assetId: string;
  assetName: string;
  patrimony?: string;
  size?: number;
}

export function AssetQRCode({ assetId, assetName, patrimony, size = 200 }: AssetQRCodeProps) {
  const baseUrl = window.location.origin;
  const assetUrl = `${baseUrl}/assets/${assetId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${assetName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .label { font-size: 12px; margin-top: 10px; color: #333; }
            .name { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .patrimony { font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <div id="qr-container"></div>
          <div class="name">${assetName}</div>
          ${patrimony ? `<div class="patrimony">Patrimonio: ${patrimony}</div>` : ''}
          <div class="label">${assetUrl}</div>
          <script>
            window.onload = function() {
              const svg = document.querySelector('#qr-container svg');
              if (svg) {
                document.body.appendChild(svg.cloneNode(true));
              }
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-xl">
        <QRCodeSVG
          value={assetUrl}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-200">{assetName}</p>
        {patrimony && <p className="text-xs text-gray-500">Patrimonio: {patrimony}</p>}
      </div>
      <button onClick={handlePrint} className="btn-secondary btn-sm">
        Imprimir QR Code
      </button>
    </div>
  );
}
