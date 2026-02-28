"use client";

import { useState } from "react";
// motion/react is part of Framer Motion
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, ExternalLink, Code2, BookOpen, Zap } from "lucide-react";

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiDocumentationModal({ isOpen, onClose }: ApiDocumentationModalProps) {
  const [activeTab, setActiveTab] = useState('quickstart');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  
  // Get the API URL dynamically for the documentation
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.onrender.com';

  const copyToClipboard = (text: string, snippetId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const tabs = [
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'endpoints', label: 'API Endpoints', icon: Code2 },
    { id: 'examples', label: 'Code Examples', icon: BookOpen }
  ];

  const codeExamples = {
    javascript: `// Install axios if you haven't already
// npm install axios

const axios = require('axios');

const apiKey = 'your-api-key-here';
const baseURL = 'https://credexa.onrender.com';

// Submit a credential
async function submitCredential() {
  try {
    const response = await axios.post(\`\${baseURL}/api/external/credentials\`, {
      studentEmail: 'student@university.edu',
      credentialTitle: 'Computer Science Degree',
      completionDate: '2024-01-15',
      certificateUrl: 'https://university.edu/certificate/123.pdf',
      nsqfLevel: 7,
      skills: ['Programming', 'Data Structures', 'Algorithms'],
      credentialType: 'degree',
      metadata: {
        program: 'Computer Science',
        grade: 'A',
        credits: 120
      }
    }, {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Credential submitted:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}`,
    python: `import requests
import json

api_key = 'your-api-key-here'
base_url = 'https://credexa.onrender.com'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

def submit_credential():
    data = {
        'studentEmail': 'student@university.edu',
        'credentialTitle': 'Computer Science Degree',
        'completionDate': '2024-01-15',
        'certificateUrl': 'https://university.edu/certificate/123.pdf',
        'nsqfLevel': 7,
        'skills': ['Programming', 'Data Structures', 'Algorithms'],
        'credentialType': 'degree',
        'metadata': {
            'program': 'Computer Science',
            'grade': 'A',
            'credits': 120
        }
    }
    
    try:
        response = requests.post(f'{base_url}/api/external/credentials', 
                               json=data, headers=headers)
        response.raise_for_status()
        print('Credential submitted:', response.json())
    except requests.exceptions.RequestException as e:
        print('Error:', e)

submit_credential()`,
    curl: `# Submit a credential (Linux/Mac)
curl -X POST http://localhost:4000/api/external/credentials \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "studentEmail": "demo@demo.com",
    "credentialTitle": "IT CORE",
    "completionDate": "2024-01-15",
    "certificateUrl": "https://ik.imagekit.io/wl9xamwdr/credexa/resumes/resume_68e675881d36b4ac99a8049f_QmVWyGyQcM1Ebntf_U9I9_FAnO4YBJY.pdf",
    "nsqfLevel": 7,
    "skills": ["Programming", "Data Structures", "Algorithms"],
    "credentialType": "degree",
    "metadata": {
      "program": "CSE",
      "grade": "A",
      "credits": 120
    }
  }'
`,
    powershell: `# Submit a credential (Windows PowerShell)
$body = '{
    "studentEmail": "student@university.edu",
    "credentialTitle": "Computer Science Degree",
    "completionDate": "2024-01-15",
    "certificateUrl": "https://university.edu/certificate/123.pdf",
    "nsqfLevel": 7,
    "skills": ["Programming", "Data Structures", "Algorithms"],
    "credentialType": "degree",
    "metadata": {
        "program": "Computer Science",
        "grade": "A",
        "credits": 120
    }
}'

$headers = @{
    "Authorization" = "Bearer your-api-key-here"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://credexa.onrender.com/api/external/credentials" -Method POST -Body $body -Headers $headers`
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/external/credentials',
      description: 'Submit a new credential',
      parameters: [
        { name: 'studentEmail', type: 'string', required: true, description: 'Email of the student receiving the credential' },
        { name: 'credentialTitle', type: 'string', required: true, description: 'Title of the credential/course' },
        { name: 'completionDate', type: 'string', required: true, description: 'Date of course completion (YYYY-MM-DD)' },
        { name: 'certificateUrl', type: 'string', required: true, description: 'URL to the certificate PDF' },
        { name: 'nsqfLevel', type: 'number', required: false, description: 'NSQF qualification level (1-10)' },
        { name: 'skills', type: 'array', required: false, description: 'Array of skills learned' },
        { name: 'credentialType', type: 'string', required: false, description: 'Type of credential (certificate, degree, diploma)' },
        { name: 'metadata', type: 'object', required: false, description: 'Additional credential information' }
      ]
    },
    {
      method: 'POST',
      path: '/api/external/credentials/bulk',
      description: 'Submit multiple credentials at once',
      parameters: [
        { name: 'credentials', type: 'array', required: true, description: 'Array of credential objects with same fields as single submission' }
      ]
    },
    {
      method: 'GET',
      path: '/api/external/credentials/{id}',
      description: 'Get credential status and details',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Credential ID' }
      ]
    },
    {
      method: 'GET',
      path: '/api/external/docs',
      description: 'Get complete API documentation',
      parameters: []
    }
  ];

  const renderQuickStart = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Getting Started with Credexa API
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The Credexa API allows you to programmatically issue and manage digital credentials. 
          Follow these steps to get started:
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              1
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Generate API Key</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-9">
            Create an API key from your dashboard with the appropriate permissions for your use case.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              2
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Authentication</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-9 mb-3">
            Include your API key in the Authorization header of all requests:
          </p>
          <div className="ml-9 bg-gray-50 dark:bg-gray-800 rounded p-3">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              Authorization: Bearer your-api-key-here
            </code>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              3
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Base URL</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-9 mb-3">
            All API requests should be made to:
          </p>
          <div className="ml-9 bg-gray-50 dark:bg-gray-800 rounded p-3">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              https://credexa.onrender.com/api/external
            </code>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              4
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Rate Limits</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-9">
            API requests are limited to 100 requests per minute. Rate limit headers are included in responses.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          Ready to test?
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
          Try submitting your first credential using our sample code in the "Code Examples" tab.
        </p>
        <button
          onClick={() => setActiveTab('examples')}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          View Code Examples <ExternalLink className="h-3 w-3 ml-1" />
        </button>
      </div>
    </div>
  );

  const renderEndpoints = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          API Endpoints
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Complete reference for all available API endpoints.
        </p>
      </div>

      {endpoints.map((endpoint, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded mr-3 ${
              endpoint.method === 'GET' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              {endpoint.method}
            </span>
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {endpoint.path}
            </code>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {endpoint.description}
          </p>
          
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Parameters:</h5>
          <div className="space-y-2">
            {endpoint.parameters.map((param, paramIndex) => (
              <div key={paramIndex} className="flex items-start text-sm">
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-3 min-w-0">
                  {param.name}
                </code>
                <div className="flex-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded mr-2 ${
                    param.required 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {param.required ? 'required' : 'optional'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {param.type}
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {param.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderExamples = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Code Examples
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sample code to help you integrate with the Credexa API.
        </p>
      </div>

      {Object.entries(codeExamples).map(([language, code]) => (
        <div key={language} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
              {language === 'javascript' ? 'JavaScript (Node.js)' : 
               language === 'curl' ? 'cURL (Linux/Mac)' : 
               language === 'powershell' ? 'PowerShell (Windows)' : 
               'Python'}
            </h4>
            <button
              onClick={() => copyToClipboard(code, language)}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {/* FIX APPLIED HERE: Add a key to the conditional element to force a clean re-render/re-mount */}
              <span key={copiedSnippet === language ? 'copied' : 'copy'} className="flex items-center">
                {copiedSnippet === language ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </span>
            </button>
          </div>
          <div className="p-4 bg-gray-900 dark:bg-gray-950 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      ))}

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
          Response Format
        </h4>
        <p className="text-sm text-green-800 dark:text-green-300 mb-3">
          All successful API responses return JSON with the following structure:
        </p>
        <div className="bg-gray-900 dark:bg-gray-950 rounded p-3 overflow-x-auto">
          <pre className="text-sm text-gray-100">
            <code>{`{
  "success": true,
  "data": {
    "id": "cred_12345",
    "status": "pending",
    "recipientEmail": "student@university.edu",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Credential submitted successfully"
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  API Documentation
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'quickstart' && renderQuickStart()}
                {activeTab === 'endpoints' && renderEndpoints()}
                {activeTab === 'examples' && renderExamples()}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
