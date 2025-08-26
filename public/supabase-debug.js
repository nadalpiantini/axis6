/**
 * Supabase Debug Console Script
 * 
 * Run this in the browser console to debug Supabase issues
 */

(function() {
  'use strict';
  
  console.group('🔍 Supabase Debug Console');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : 'Not available in browser');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', typeof process !== 'undefined' ? (process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing') : 'Not available in browser');
  
  // Check browser storage
  console.log('\nBrowser Storage:');
  console.log('- localStorage available:', !!window.localStorage);
  console.log('- sessionStorage available:', !!window.sessionStorage);
  
  // Check for Supabase-related data
  if (window.localStorage) {
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    console.log('- Supabase localStorage keys:', supabaseKeys);
  }
  
  // Check for global Supabase objects
  console.log('\nGlobal Objects:');
  console.log('- window.supabase:', !!window.supabase);
  console.log('- window.__supabaseError:', window.__supabaseError || 'None');
  
  // Check for React Query
  console.log('- window.queryClient:', !!window.queryClient);
  
  // Check network requests
  console.log('\nNetwork Status:');
  console.log('- navigator.onLine:', navigator.onLine);
  
  // Test Supabase connection if possible
  if (window.supabaseDebug) {
    console.log('\nTesting connection...');
    window.supabaseDebug.testConnection().then(result => {
      console.log('Connection test result:', result);
    }).catch(error => {
      console.error('Connection test failed:', error);
    });
  }
  
  // Provide helpful commands
  console.log('\n💡 Available Commands:');
  console.log('- window.supabaseDebug.log() - Show detailed debug info');
  console.log('- window.supabaseDebug.clearData() - Clear all Supabase data');
  console.log('- window.supabaseDebug.testConnection() - Test connection');
  
  console.groupEnd();
  
  // Add global helper
  window.supabaseDebugConsole = {
    clearAllData: function() {
      if (window.supabaseDebug) {
        window.supabaseDebug.clearData();
      }
      if (window.localStorage) {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        );
        keys.forEach(key => localStorage.removeItem(key));
      }
      if (window.sessionStorage) {
        const keys = Object.keys(sessionStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        );
        keys.forEach(key => sessionStorage.removeItem(key));
      }
      console.log('✅ All Supabase data cleared');
    },
    
    reload: function() {
      window.location.reload();
    },
    
    showError: function() {
      console.log('Current Supabase error:', window.__supabaseError || 'None');
    }
  };
  
  console.log('🚀 Debug console ready! Use window.supabaseDebugConsole for quick actions');
  
})();
