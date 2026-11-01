export const user = {id:'scroll-qa', full_name:'Scrolling QA', email:'qa@example.invalid', guide_seen:true};
export const useAuth = () => ({user,isAuthenticated:true});
export const WORKSPACES={personal:{label:'QA workspace'}};
export const useWorkspace=()=>({workspace:'personal',isDemo:false,isSeeding:false,demoRevision:0,setWorkspace:()=>{}});
