import React, { useEffect, useState } from 'react';
import { Copy, Check, Database, Shield, FileCode } from 'lucide-react';
import { SpringBootFile, springBootApi } from '../services/api';

export const SpringBootSourcePage: React.FC = () => {
  const [files, setFiles] = useState<SpringBootFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    springBootApi.getSourceFiles().then((list) => {
      setFiles(list);
    });
  }, []);

  const activeFile = files[selectedIndex] || null;

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const restEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      roles: 'Public',
      description: 'Validates campus email/password and returns signed HS256 JWT token',
    },
    {
      method: 'POST',
      endpoint: '/api/v1/auth/register',
      roles: 'Public',
      description: 'Validates user registration DTO and persists account in MySQL users table',
    },
    {
      method: 'GET',
      endpoint: '/api/v1/items',
      roles: 'OWNER, FINDER, ADMIN_SECURITY',
      description: 'Multi-filter search across type, category, campusZone, hubId, custodyStatus, and keyword',
    },
    {
      method: 'POST',
      endpoint: '/api/v1/items',
      roles: 'OWNER, FINDER, ADMIN_SECURITY',
      description: 'Jakarta Bean Validated (@Valid) creation of Lost or Found item report & Custody Receipt',
    },
    {
      method: 'PATCH',
      endpoint: '/api/v1/items/{id}/custody-intake',
      roles: 'FINDER, ADMIN_SECURITY',
      description: 'Logs physical submission of found item into a Fixed Campus Collection Hub locker bin',
    },
    {
      method: 'POST',
      endpoint: '/api/v1/claims',
      roles: 'OWNER, FINDER, ADMIN_SECURITY',
      description: 'Submits ownership verification challenge response and proof of ownership',
    },
    {
      method: 'PATCH',
      endpoint: '/api/v1/claims/{id}/verify',
      roles: 'ADMIN_SECURITY, FINDER',
      description: 'Approves or rejects ownership claim; issues Fixed Collection Pickup Pass Code (PKP-...)',
    },
    {
      method: 'PATCH',
      endpoint: '/api/v1/claims/{id}/handover',
      roles: 'ADMIN_SECURITY',
      description: 'Confirms physical desk handover at Fixed Hub and updates status to RETURNED',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Spring Boot 3, Maven, Spring Security, JWT & MySQL Architecture
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Complete Java 21 Spring Boot backend source files, Jakarta Bean Validation DTOs, and MySQL 8.0 relational schema located in <span className="font-mono text-xs text-slate-800">/spring-boot-backend/</span>
        </p>
      </div>

      {/* Stack Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Shield className="w-4 h-4 text-slate-600" />
            <span>Spring Security 6 & Stateless JWT</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Uses <span className="font-mono">OncePerRequestFilter</span> and HMAC-SHA256 bearer tokens with role-based <span className="font-mono">@PreAuthorize</span> rules for <span className="font-mono">OWNER</span>, <span className="font-mono">FINDER</span>, and <span className="font-mono">ADMIN_SECURITY</span>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <FileCode className="w-4 h-4 text-slate-600" />
            <span>Jakarta Bean Validation</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Request payloads enforce <span className="font-mono">@NotBlank</span>, <span className="font-mono">@Size</span>, <span className="font-mono">@Pattern</span>, and <span className="font-mono">@Email</span> constraints with structured <span className="font-mono">fieldErrors</span> responses.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Database className="w-4 h-4 text-slate-600" />
            <span>MySQL 8.0 Relational Schema</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Normalized InnoDB tables (<span className="font-mono">users</span>, <span className="font-mono">collection_hubs</span>, <span className="font-mono">item_reports</span>, <span className="font-mono">ownership_claims</span>, <span className="font-mono">notifications</span>) with foreign key constraints.
          </p>
        </div>
      </div>

      {/* Source Code Viewer */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {files.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedIndex === idx
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {file.title}
              </button>
            ))}
          </div>

          {activeFile && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          )}
        </div>

        {activeFile && (
          <div>
            <div className="px-5 py-2.5 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 bg-white">
              <span>{activeFile.description}</span>
              <span className="font-mono text-slate-400">{activeFile.path}</span>
            </div>
            <pre className="p-5 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[520px]">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        )}
      </section>

      {/* REST API Contract Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900">
            REST API Endpoint Contract (Axios Client Integration)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All protected endpoints require a valid <span className="font-mono">Authorization: Bearer &lt;JWT&gt;</span> header
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">HTTP Method</th>
                <th className="py-3 px-4">Endpoint URI</th>
                <th className="py-3 px-4">Spring Security Roles</th>
                <th className="py-3 px-4">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {restEndpoints.map((ep) => (
                <tr key={`${ep.method}-${ep.endpoint}`} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {ep.method}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800 whitespace-nowrap">
                    {ep.endpoint}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {ep.roles}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
