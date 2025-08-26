const fs = require('fs');
const path = require('path');

// Lista de archivos que necesitan corrección
const filesToFix = [
  'components/error/SupabaseErrorBoundary.tsx',
  'components/chat/ChatMessage.tsx',
  'components/chat/ChatRoomList.tsx',
  'components/chat/ImageLightbox.tsx',
  'components/chat/AnalyticsDashboard.tsx',
  'components/chat/FileUpload.tsx',
  'components/chat/ChatRoom.tsx',
  'components/chat/ChatHeader.tsx',
  'components/chat/ChatComposer.tsx',
  'components/chat/NotificationSettings.tsx',
  'components/chat/ChatParticipants.tsx',
  'components/chat/ChatMessageList.tsx',
  'components/chat/MessageSearch.tsx',
  'components/chat/SearchResults.tsx',
  'components/chat/SearchPage.tsx'
];

function fixButtonImports() {
  filesToFix.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Reemplazar import de button minúscula por Button mayúscula
      content = content.replace(
        /from ['"]@\/components\/ui\/button['"]/g,
        "from '@/components/ui/Button'"
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`❌ File not found: ${filePath}`);
    }
  });
}

fixButtonImports();
console.log('🎉 All Button imports have been standardized!');
