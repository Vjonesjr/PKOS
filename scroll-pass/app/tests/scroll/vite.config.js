import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../..',import.meta.url));
export default defineConfig({root,plugins:[react(),{name:'qa-entry',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.headers.accept?.includes('text/html'))req.url='/tests/scroll/index.html';next();});}}],resolve:{alias:[{find:'@/api/base44Client',replacement:root+'/tests/scroll/api.js'},{find:'@/lib/WorkspaceContext',replacement:root+'/tests/scroll/context.jsx'},{find:'@/lib/AuthContext',replacement:root+'/tests/scroll/context.jsx'},{find:'@',replacement:root+'/src'}]},server:{host:'127.0.0.1',port:4174},appType:'spa'});
