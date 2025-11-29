import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Loader, Database, Table } from 'lucide-react';

interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
  status: 'success' | 'error' | 'loading';
  error?: string;
}

export const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test basic connection by querying a system table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) {
        // If user_profiles doesn't exist, try to get schema info
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          // Table might not exist, but connection works
          setConnectionStatus('connected');
          setConnectionError('Tables may not exist yet. Checking schema...');
        } else {
          setConnectionStatus('error');
          setConnectionError(error.message);
        }
      } else {
        setConnectionStatus('connected');
        setConnectionError('');
      }

      // Check all expected tables
      await checkTables();
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionError(err.message || 'Failed to connect to Supabase');
      setLoading(false);
    }
  };

  const checkTables = async () => {
    const expectedTables = [
      'user_profiles',
      'teams',
      'team_members',
      'tasks',
      'agent_logs'
    ];

    const tableChecks = await Promise.all(
      expectedTables.map(async (tableName) => {
        try {
          // Try to get table info by querying with limit 0
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) {
            return {
              name: tableName,
              columns: [],
              rowCount: 0,
              status: 'error' as const,
              error: error.message
            };
          }

          // Try to get column names by fetching one row
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          const columns = sampleData && sampleData.length > 0 
            ? Object.keys(sampleData[0])
            : [];

          return {
            name: tableName,
            columns,
            rowCount: count || 0,
            status: 'success' as const
          };
        } catch (err: any) {
          return {
            name: tableName,
            columns: [],
            rowCount: 0,
            status: 'error' as const,
            error: err.message
          };
        }
      })
    );

    setTables(tableChecks);
    setLoading(false);
  };

  const testQuery = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      if (error) throw error;
      
      alert(`Success! Found ${data?.length || 0} rows in ${tableName}:\n\n${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      alert(`Error querying ${tableName}: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Supabase Connection Test</h1>
          </div>

          {/* Connection Status */}
          <div className="mb-8 p-6 rounded-lg bg-gray-50 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              {connectionStatus === 'checking' && (
                <>
                  <Loader className="animate-spin text-blue-500" size={24} />
                  <span className="text-lg font-semibold text-gray-700">Checking connection...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-lg font-semibold text-green-700">Connected to Supabase!</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <XCircle className="text-red-500" size={24} />
                  <span className="text-lg font-semibold text-red-700">Connection Failed</span>
                </>
              )}
            </div>
            {connectionError && (
              <p className="text-sm text-gray-600 mt-2 ml-9">{connectionError}</p>
            )}
            <div className="mt-4 ml-9 text-xs text-gray-500">
              <p><strong>URL:</strong> https://xtysfwxmjhaynieoxwgh.supabase.co</p>
              <p><strong>Status:</strong> {connectionStatus === 'connected' ? 'Active' : 'Inactive'}</p>
            </div>
          </div>

          {/* Tables Status */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Table size={20} />
              Database Tables
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader className="animate-spin" size={16} />
                <span>Checking tables...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className={`p-4 rounded-lg border-2 ${
                      table.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {table.status === 'success' ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <XCircle className="text-red-600" size={20} />
                        )}
                        <span className="font-bold text-gray-900">{table.name}</span>
                      </div>
                      {table.status === 'success' && (
                        <button
                          onClick={() => testQuery(table.name)}
                          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                        >
                          Test Query
                        </button>
                      )}
                    </div>
                    {table.status === 'success' ? (
                      <div className="ml-7 text-sm text-gray-700">
                        <p><strong>Rows:</strong> {table.rowCount}</p>
                        <p><strong>Columns:</strong> {table.columns.length > 0 ? table.columns.join(', ') : 'No data to infer columns'}</p>
                        {table.columns.length > 0 && (
                          <div className="mt-2">
                            <details className="text-xs">
                              <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                                View all columns
                              </summary>
                              <ul className="mt-2 list-disc list-inside">
                                {table.columns.map((col) => (
                                  <li key={col} className="text-gray-600">{col}</li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ml-7 text-sm text-red-700">
                        <p><strong>Error:</strong> {table.error || 'Table not found or inaccessible'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schema Info */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Expected Schema</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>user_profiles:</strong> id (uuid), email, name, role, avatar, created_at</p>
              <p>• <strong>teams:</strong> id (int8), name, skills (text[]), lead_id (uuid), created_at</p>
              <p>• <strong>team_members:</strong> id (int8), team_id (int8), member_id (uuid), workload (int4), created_at</p>
              <p>• <strong>tasks:</strong> id (int8), title, description, status, assigned_team_id, assigned_member_id, progress, deadline, overload_flag, created_at, updated_at</p>
              <p>• <strong>agent_logs:</strong> id (int8), task_id (int8), agent_name, action, timestamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

