const http = require('http');
const url = require('url');

const PORT = 3001;

// Mock data
const mockMarketingData = [
  {
    id: '1',
    title: 'Swiss Tech Campaign',
    category: 'VERKAUFSFOERDERUNG',
    status: 'ACTIVE',
    weight: 8,
    budgetCHF: 5000,
    actualCostsCHF: 3200,
    expectedLeads: 100,
    actualLeads: 65,
    startDate: '2025-09-01T00:00:00.000Z',
    endDate: '2025-09-30T23:59:59.999Z',
    owner: 'Marketing Team',
    notes: 'Fokus auf B2B Kunden',
    createdAt: '2025-09-01T10:00:00.000Z',
    updatedAt: '2025-09-05T14:30:00.000Z'
  },
  {
    id: '2',
    title: 'Brand Awareness Q4',
    category: 'IMAGE',
    status: 'PLANNED',
    weight: 6,
    budgetCHF: 8000,
    actualCostsCHF: 0,
    expectedLeads: 200,
    actualLeads: 0,
    startDate: '2025-10-01T00:00:00.000Z',
    endDate: '2025-12-31T23:59:59.999Z',
    owner: 'Brand Manager',
    notes: 'Vorbereitung für 2026',
    createdAt: '2025-09-01T10:00:00.000Z',
    updatedAt: '2025-09-05T14:30:00.000Z'
  }
];

// Helper functions
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function sendJSON(res, data, statusCode = 200) {
  setCORSHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health endpoints
    if (pathname === '/api/health') {
      return sendJSON(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'development'
      });
    }

    if (pathname === '/api/health/ready') {
      return sendJSON(res, {
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    }

    // Marketing data endpoints
    if (pathname === '/api/marketing-data') {
      if (method === 'GET' || method === 'HEAD') {
        if (method === 'HEAD') {
          setCORSHeaders(res);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end();
        }
        // Return data in the expected format with pagination
        const response = {
          data: mockMarketingData,
          pagination: {
            page: 1,
            limit: 50,
            total: mockMarketingData.length,
            pages: Math.ceil(mockMarketingData.length / 50)
          }
        };
        return sendJSON(res, response);
      }
      if (method === 'POST') {
        const body = await getBody(req);
        const newData = {
          id: String(mockMarketingData.length + 1),
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockMarketingData.push(newData);
        return sendJSON(res, newData, 201);
      }
    }

    // Marketing data stats endpoint (must be before single item matcher)
    if (pathname === '/api/marketing-data/stats') {
      if (method === 'GET') {
        // Generate mock stats from existing data
        const stats = {
          totalActivities: mockMarketingData.length,
          totalBudget: mockMarketingData.reduce((sum, item) => sum + (item.budgetCHF || 0), 0),
          totalSpent: mockMarketingData.reduce((sum, item) => sum + (item.actualCostsCHF || 0), 0),
          expectedLeads: mockMarketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0),
          actualLeads: mockMarketingData.reduce((sum, item) => sum + (item.actualLeads || 0), 0),
          monthlyBreakdown: {
            "January": { budget: 5000, spent: 3200, leads: 65 },
            "February": { budget: 8000, spent: 0, leads: 0 },
            "March": { budget: 0, spent: 0, leads: 0 }
          },
          categoryBreakdown: {
            "VERKAUFSFOERDERUNG": mockMarketingData.filter(item => item.category === 'VERKAUFSFOERDERUNG').length,
            "IMAGE": mockMarketingData.filter(item => item.category === 'IMAGE').length,
            "MARKETING": mockMarketingData.filter(item => item.category === 'MARKETING').length
          },
          statusBreakdown: {
            "ACTIVE": mockMarketingData.filter(item => item.status === 'ACTIVE').length,
            "PLANNED": mockMarketingData.filter(item => item.status === 'PLANNED').length,
            "COMPLETED": mockMarketingData.filter(item => item.status === 'COMPLETED').length
          }
        };
        return sendJSON(res, stats);
      }
    }

    // Single marketing data
    const marketingDataMatch = pathname.match(/^\/api\/marketing-data\/(.+)$/);
    if (marketingDataMatch) {
      const id = marketingDataMatch[1];
      const data = mockMarketingData.find(item => item.id === id);
      
      if (method === 'GET') {
        if (!data) {
          return sendJSON(res, { message: 'Marketing data not found' }, 404);
        }
        return sendJSON(res, data);
      }
      
      if (method === 'PUT') {
        const index = mockMarketingData.findIndex(item => item.id === id);
        if (index === -1) {
          return sendJSON(res, { message: 'Marketing data not found' }, 404);
        }
        const body = await getBody(req);
        mockMarketingData[index] = {
          ...mockMarketingData[index],
          ...body,
          updatedAt: new Date().toISOString()
        };
        return sendJSON(res, mockMarketingData[index]);
      }
      
      if (method === 'DELETE') {
        const index = mockMarketingData.findIndex(item => item.id === id);
        if (index === -1) {
          return sendJSON(res, { message: 'Marketing data not found' }, 404);
        }
        mockMarketingData.splice(index, 1);
        setCORSHeaders(res);
        res.writeHead(204);
        res.end();
        return;
      }
    }

    // CRM endpoints
    if (pathname === '/api/crm/companies') {
      return sendJSON(res, [
        { id: '1', name: 'Swiss Tech AG', domain: 'swisstech.ch', size: '50-200', createdAt: new Date().toISOString() },
        { id: '2', name: 'Innovation Labs', domain: 'innovlabs.ch', size: '10-50', createdAt: new Date().toISOString() }
      ]);
    }

    if (pathname === '/api/crm/contacts') {
      return sendJSON(res, [
        { id: '1', name: 'Max Mustermann', email: 'max@swisstech.ch', role: 'Marketing Manager', companyId: '1' },
        { id: '2', name: 'Anna Schmidt', email: 'anna@innovlabs.ch', role: 'CEO', companyId: '2' }
      ]);
    }

    if (pathname === '/api/crm/deals') {
      return sendJSON(res, [
        { id: '1', title: 'Marketing Automation Project', value: 25000, currency: 'CHF', stage: 'negotiation', companyId: '1' },
        { id: '2', title: 'Website Redesign', value: 15000, currency: 'CHF', stage: 'proposal', companyId: '2' }
      ]);
    }

    // Budget endpoints
    if (pathname === '/api/budget/plans') {
      return sendJSON(res, [
        { id: '1', period: 'Q1-2025', budgetSoll: 100000, budgetIst: 85000, category: 'VERKAUFSFOERDERUNG' },
        { id: '2', period: 'Q2-2025', budgetSoll: 120000, budgetIst: 110000, category: 'IMAGE' }
      ]);
    }

    // Content endpoints
    if (pathname === '/api/content/tasks') {
      return sendJSON(res, [
        { id: '1', title: 'Blog Post: Swiss Marketing Trends', channel: 'Blog', format: 'Article', status: 'in-progress', deadline: '2025-12-31' },
        { id: '2', title: 'Social Media Campaign', channel: 'Social', format: 'Video', status: 'planned', deadline: '2025-11-15' }
      ]);
    }

    // API root
    if (pathname === '/api' || pathname === '/api/') {
      return sendJSON(res, {
        message: 'Marketing Kreis Mock API',
        version: '1.0.0',
        endpoints: [
          'GET /api/health',
          'GET /api/marketing-data',
          'GET /api/crm/companies',
          'GET /api/crm/contacts',
          'GET /api/crm/deals',
          'GET /api/budget/plans',
          'GET /api/content/tasks'
        ]
      });
    }

    // 404 for other routes
    sendJSON(res, { message: 'Not Found', path: pathname }, 404);

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, { message: 'Internal Server Error', error: error.message }, 500);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Mock Backend API running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});













