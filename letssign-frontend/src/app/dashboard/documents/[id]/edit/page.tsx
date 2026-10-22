'use client';

import { Suspense } from 'react';
import { EditDocumentContent } from '@/components/edit-document-content';

export default function EditDocumentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" /></div>}>
      <EditDocumentContent />
    </Suspense>
  );
}