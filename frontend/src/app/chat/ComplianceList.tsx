"use client";
import { useState } from 'react';

interface ComplianceDocument {
  id: number;
  regulation: string;
  compliance_issues: string;
  status: 'non-compliant' | 'compliant' | 'in-progress';
  next_steps: string;
}

export default function ComplianceList() {
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [complianceDocuments, setComplianceDocuments] = useState<ComplianceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckCompliance = async () => {
    setIsLoading(true);
    try {
      const sensorResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/hvac-metrics/5`);
      const sensorData = await sensorResponse.json();

      const complianceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/check-compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensor_data: sensorData })
      });

      const complianceData = await complianceResponse.json();
      let i = 0;
      for (const doc of complianceData) {
        doc.id = i;
        i++;
      }

      console.log(complianceData);
      setComplianceDocuments(complianceData);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {complianceDocuments.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500 mb-4">
            No compliance requirements found. <br />
            Please upload relevant regulations and click `Check Compliance`
          </p>

          <div className="flex items-center justify-center gap-4 mb-4">

            <button
              onClick={handleCheckCompliance}
              disabled={isLoading}
              className="px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#ff8d41] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Checking...' : 'Check Compliance'}
            </button>
          </div>
        </div>
      ) : (
        complianceDocuments.map((doc: ComplianceDocument) => (
          <div
            key={doc.id}
            className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm relative"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">{doc.regulation}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'compliant' ? 'bg-green-100 text-green-700' :
                    doc.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 border-red text-red-700 font-semibold'
                  }`}>
                  {doc.status.toLowerCase()}
                </span>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === doc.id ? null : doc.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {openActionId === doc.id && (
                    <div className="absolute right-0 top-8 z-10 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-100">
                      <div className="py-1 text-sm text-gray-700">
                        <button
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => console.log('Mark complete:', doc.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Complete
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => console.log('View details:', doc.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Details
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-red-600 hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => console.log('Delete:', doc.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-800 mb-2">{doc.compliance_issues}</p>
            <p className="text-xs text-gray-500">Actionable Steps: {doc.next_steps}</p>
          </div>
        ))
      )}
    </div>
  );
} 