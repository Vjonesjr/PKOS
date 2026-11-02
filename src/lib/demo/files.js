const FILES = new Set(['/demo-files/portfolio-brief.md','/demo-files/interview-notes.txt','/demo-files/planning-sketch.svg']);
export const isBundledDemoDocument = doc => doc?.workspace === 'demo' && FILES.has(doc.file_uri);
export const demoDocumentURL = doc => isBundledDemoDocument(doc) ? new URL(doc.file_uri, window.location.origin).href : null;
