// ABOUTME: Debug page to investigate community sidebar data issues

import React from 'react';
import { useCommunitySidebarDataQuery } from '../../packages/hooks/useCommunityManagementQuery';

const DebugSidebar = () => {
  const { data, isLoading, error, isError } = useCommunitySidebarDataQuery();

  console.log('🔍 DebugSidebar render:', {
    data,
    isLoading,
    error,
    isError,
    dataExists: !!data,
    dataType: typeof data,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Community Sidebar Debug</h1>

      <div className="space-y-6">
        {/* Loading State */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Loading State</h2>
          <p>isLoading: {isLoading ? 'true' : 'false'}</p>
          <p>isError: {isError ? 'true' : 'false'}</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 border border-red-300 rounded bg-red-50">
            <h2 className="font-semibold mb-2 text-red-800">Error</h2>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Data State */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Data State</h2>
          <p>Data exists: {data ? 'true' : 'false'}</p>
          <p>Data type: {typeof data}</p>

          {data && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Data Structure:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>Sections: {data.sections?.length || 0}</p>
                  <p>Categories: {data.categories?.length || 0}</p>
                  <p>Announcements: {data.announcements?.length || 0}</p>
                </div>
                <div>
                  <p>Recent Members: {data.recentMembers?.length || 0}</p>
                  <p>Moderators: {data.moderators?.length || 0}</p>
                  <p>Total Members: {data.memberStats?.totalMembers || 0}</p>
                  <p>Online Count: {data.memberStats?.onlineCount || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Raw Data */}
        {data && (
          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-2">Raw Data</h2>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {/* Sections Detail */}
        {data?.sections && (
          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-2">Sections Detail</h2>
            {data.sections.map((section: any, index: number) => (
              <div key={section.id || index} className="mb-2 p-2 bg-gray-50 rounded">
                <p>
                  <strong>Type:</strong> {section.section_type}
                </p>
                <p>
                  <strong>Title:</strong> {section.title}
                </p>
                <p>
                  <strong>Visible:</strong> {section.is_visible ? 'Yes' : 'No'}
                </p>
                {section.computed_data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">Computed Data</summary>
                    <pre className="text-xs mt-1 p-2 bg-white rounded">
                      {JSON.stringify(section.computed_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Direct API Test */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Direct API Test</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={async () => {
              try {
                console.log('🧪 Testing direct API call...');
                const response = await fetch(
                  'https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/get-community-sidebar-data',
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  }
                );
                const result = await response.json();
                console.log('🧪 Direct API result:', result);
                alert(`Direct API call result: ${response.status} - Check console for details`);
              } catch (error) {
                console.error('🧪 Direct API error:', error);
                alert(`Direct API error: ${error}`);
              }
            }}
          >
            Test Direct API Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugSidebar;
