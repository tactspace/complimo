"use client";

interface ComplianceDocument {
  id: number;
  name: string;
  status: 'non-compliant' | 'completed' | 'in-progress';
  dueDate: string;
}

const complianceDocuments: ComplianceDocument[] = [
  { id: 1, name: "Safety Audit Report", status: "non-compliant", dueDate: "2024-03-15" },
  { id: 2, name: "Employee Training Records", status: "completed", dueDate: "2024-03-20" },
  { id: 3, name: "Environmental Impact Assessment", status: "in-progress", dueDate: "2024-04-01" },
];

export default function ComplianceList() {
  return (
    <div className="space-y-3">
      {complianceDocuments.map((doc: ComplianceDocument) => (
        <div 
          key={doc.id}
          className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{doc.name}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              doc.status === 'completed' ? 'bg-green-100 text-green-700' :
              doc.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {doc.status}
            </span>
          </div>
          <p className="text-xs text-gray-500">Due: {doc.dueDate}</p>
        </div>
      ))}
    </div>
  );
} 