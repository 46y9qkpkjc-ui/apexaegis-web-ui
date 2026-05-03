'use client';
import { useState } from 'react';
import { Lock, Upload, Trash2, Download, Shield, AlertTriangle } from 'lucide-react';

interface CABundle {
  id: string;
  name: string;
  issuer: string;
  expiresAt: string;
  fingerprint: string;
  uploadedAt: string;
  usedInProfiles: number;
}

const demoBundles: CABundle[] = [
  {
    id: '1', name: 'Acme Corp Root CA', issuer: 'CN=Acme Corp Root CA, O=Acme Corp',
    expiresAt: '2029-12-31', fingerprint: 'SHA256:AB:CD:EF:12:34...',
    uploadedAt: '2024-06-15', usedInProfiles: 2,
  },
  {
    id: '2', name: 'Acme Intermediate CA', issuer: 'CN=Acme Intermediate CA, O=Acme Corp',
    expiresAt: '2027-06-30', fingerprint: 'SHA256:98:76:54:32:10...',
    uploadedAt: '2024-06-15', usedInProfiles: 2,
  },
];

export default function CertificatesPage() {
  const [bundles, setBundles] = useState<CABundle[]>(demoBundles);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    // In production: POST /api/v1/certificates with multipart form
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (!file.name.match(/\.(pem|crt|cer|p7b)$/i)) {
        alert('Unsupported format. Use PEM, CRT, CER, or P7B.');
        return;
      }
      // In production: upload to API, parse cert, display details
      const newBundle: CABundle = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.(pem|crt|cer|p7b)$/i, ''),
        issuer: 'Parsing...',
        expiresAt: 'Parsing...',
        fingerprint: 'Uploading...',
        uploadedAt: new Date().toISOString().split('T')[0],
        usedInProfiles: 0,
      };
      setBundles(prev => [...prev, newBundle]);
    });
    setShowUpload(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock size={24} className="text-yellow-400" />
          <div>
            <h1 className="text-xl font-semibold">CA Certificates</h1>
            <p className="text-sm text-gray-500">
              Upload your organization&apos;s CA bundle for SSL Full Inspection (Inline Proxy)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={16} />
          Upload CA Bundle
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-yellow-900/15 border border-yellow-800/30 rounded-xl">
        <AlertTriangle size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-yellow-300 font-medium">SSL Full Inspection requires your CA certificate</p>
          <p className="text-yellow-500/80 mt-1">
            Upload your organization&apos;s root and intermediate CA certificates. The gateway will generate
            leaf certificates signed by your CA for inspected domains. Ensure your CA is trusted
            on all managed endpoints.
          </p>
        </div>
      </div>

      {/* Bundles table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Issuer</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Fingerprint</th>
              <th className="px-4 py-3 text-center">Used In</th>
              <th className="w-24 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {bundles.map(bundle => (
              <tr key={bundle.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-green-400" />
                    <span className="font-medium">{bundle.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{bundle.issuer}</td>
                <td className="px-4 py-3 text-gray-400">{bundle.expiresAt}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{bundle.fingerprint}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">
                    {bundle.usedInProfiles} profiles
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Download">
                      <Download size={14} />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowUpload(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4">Upload CA Certificate Bundle</h3>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-900/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <Upload size={32} className="mx-auto text-gray-500 mb-3" />
              <p className="text-sm text-gray-400 mb-2">
                Drag & drop your CA certificate files
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Supported formats: PEM, CRT, CER, P7B
              </p>
              <label className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm cursor-pointer transition-colors">
                Browse Files
                <input
                  type="file"
                  accept=".pem,.crt,.cer,.p7b"
                  multiple
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) handleFiles(Array.from(e.target.files));
                  }}
                />
              </label>
            </div>

            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Bundle requirements:</h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Include both root CA and intermediate CA certificates</li>
                <li>• Private key must be uploaded separately (PEM format)</li>
                <li>• Certificate chain must be valid and not expired</li>
                <li>• RSA 2048+ or ECDSA P-256/P-384 keys supported</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
